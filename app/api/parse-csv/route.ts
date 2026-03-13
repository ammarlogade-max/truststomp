import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
}

interface ParsedSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsAmount: number;
  upiTransactionsMonth: number;
  digitalWalletUsage: number;
  onTimePayments: number;
  totalPayments: number;
  loanRepayments: number;
  loanDefaults: number;
  monthsOfHistory: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    transactions: number;
    savings: number;
  }>;
  confidence: number;
  warnings: string[];
}

const UPI_KEYWORDS = ["upi", "gpay", "phonepe", "paytm", "bhim", "razorpay"];
const WALLET_KEYWORDS = ["wallet", "amazon pay", "freecharge", "mobikwik", "airtel money"];
const LOAN_KEYWORDS = ["emi", "home loan", "car loan", "personal loan", "mortgage"];

function detectSeparator(line: string): string {
  if (line.includes(",")) return ",";
  if (line.includes(";")) return ";";
  if (line.includes("\t")) return "\t";
  return ",";
}

function parseAmount(raw: string): number {
  if (!raw || raw.trim() === "") return 0;
  const cleaned = raw.replace(/[₹$,\s]/g, "").replace(/[()]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function parseDate(raw: string): Date | null {
  if (!raw || raw.trim() === "") return null;
  const cleaned = raw.trim();

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = cleaned.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}`);
    if (!isNaN(d.getTime())) return d;
  }

  // YYYY-MM-DD
  const ymd = cleaned.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
  if (ymd) {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;
  }

  // DD-MM-YY
  const dmyShort = cleaned.match(/^(\d{2})[-\/](\d{2})[-\/](\d{2})$/);
  if (dmyShort) {
    const year = parseInt(dmyShort[3]) > 50 ? `19${dmyShort[3]}` : `20${dmyShort[3]}`;
    const d = new Date(`${year}-${dmyShort[2]}-${dmyShort[1]}`);
    if (!isNaN(d.getTime())) return d;
  }

  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;
  } catch {}
  return null;
}

function detectColumns(headers: string[]): {
  date: number; description: number; debit: number; credit: number; amount: number; balance: number;
} {
  const h = headers.map(x => x.toLowerCase().trim().replace(/['"]/g, ""));
  return {
    date:        h.findIndex(x => x.includes("date") || x === "txn date" || x === "value date"),
    description: h.findIndex(x => x.includes("desc") || x.includes("narration") || x.includes("particular") || x.includes("remark") || x.includes("detail") || x.includes("transaction")),
    debit:       h.findIndex(x => x === "debit" || x === "dr" || x === "withdrawal" || x === "debit amount" || x.includes("withdraw")),
    credit:      h.findIndex(x => x === "credit" || x === "cr" || x === "deposit" || x === "credit amount" || x.includes("deposit")),
    amount:      h.findIndex(x => x === "amount" || x === "transaction amount" || x === "amt"),
    balance:     h.findIndex(x => x.includes("balance") || x === "bal"),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });

    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim() && !l.trim().startsWith("#"));

    if (lines.length < 3) {
      return NextResponse.json({ error: "File too short — needs at least a header and 2 data rows." }, { status: 400 });
    }

    const separator = detectSeparator(lines[0]);
    const headers = lines[0].split(separator).map(h => h.replace(/"/g, "").trim());
    const cols = detectColumns(headers);

    const warnings: string[] = [];
    if (cols.date === -1) warnings.push("Date column not found — using row order");
    if (cols.description === -1) warnings.push("Description column not found");

    const transactions: ParsedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw.trim()) continue;

      // Split respecting quoted fields
      const row: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of raw) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === separator && !inQuotes) { row.push(current.trim()); current = ""; }
        else { current += char; }
      }
      row.push(current.trim());

      if (row.length < 2) continue;

      const desc = cols.description >= 0 ? (row[cols.description] || "") : (row[1] || "");
      const descLower = desc.toLowerCase();

      let amount = 0;
      let type: "credit" | "debit" = "debit";

      if (cols.credit >= 0 && cols.debit >= 0) {
        // Separate debit/credit columns (most Indian bank formats)
        const creditVal = parseAmount(row[cols.credit] || "");
        const debitVal = parseAmount(row[cols.debit] || "");

        if (creditVal > 0 && debitVal === 0) {
          amount = creditVal;
          type = "credit";
        } else if (debitVal > 0 && creditVal === 0) {
          amount = debitVal;
          type = "debit";
        } else if (creditVal > 0) {
          amount = creditVal;
          type = "credit";
        } else if (debitVal > 0) {
          amount = debitVal;
          type = "debit";
        }
      } else if (cols.amount >= 0) {
        // Single amount column — guess type from description
        amount = parseAmount(row[cols.amount] || "");
        const isCredit =
          descLower.includes(" cr") || descLower.includes("cr/") ||
          descLower.includes("salary") || descLower.includes("credit") ||
          descLower.includes("received") || descLower.includes("refund") ||
          descLower.includes("neft cr") || descLower.includes("imps cr") ||
          descLower.includes("interest") || descLower.includes("dividend") ||
          descLower.includes("bonus") || descLower.includes("cashback");
        type = isCredit ? "credit" : "debit";
      }

      if (amount === 0) continue;

      // Skip balance/opening entries
      if (descLower.includes("opening balance") || descLower.includes("closing balance")) continue;

      const rawDate = cols.date >= 0 ? (row[cols.date] || "") : "";
      const parsedDate = parseDate(rawDate);
      const dateStr = parsedDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0];

      transactions.push({ date: dateStr, description: desc, amount, type });
    }

    if (transactions.length === 0) {
      return NextResponse.json({
        error: "No valid transactions found. Make sure your CSV has Date, Description, and Debit/Credit columns."
      }, { status: 400 });
    }

    // Group by month
    const byMonth: Record<string, {
      label: string; income: number; expenses: number;
      transactions: number; upi: number; wallet: number; loans: number;
    }> = {};

    for (const tx of transactions) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

      if (!byMonth[key]) {
        byMonth[key] = { label, income: 0, expenses: 0, transactions: 0, upi: 0, wallet: 0, loans: 0 };
      }

      byMonth[key].transactions++;

      if (tx.type === "credit") {
        byMonth[key].income += tx.amount;
      } else {
        byMonth[key].expenses += tx.amount;
      }

      const dl = tx.description.toLowerCase();
      if (UPI_KEYWORDS.some(k => dl.includes(k))) byMonth[key].upi++;
      if (WALLET_KEYWORDS.some(k => dl.includes(k))) byMonth[key].wallet++;
      if (LOAN_KEYWORDS.some(k => dl.includes(k))) byMonth[key].loans++;
    }

    const months = Object.keys(byMonth).sort();
    const monthsOfHistory = months.length;

    if (monthsOfHistory === 0) {
      return NextResponse.json({ error: "Could not group transactions by month." }, { status: 400 });
    }

    const avgIncome   = months.reduce((s, m) => s + byMonth[m].income,   0) / monthsOfHistory;
    const avgExpenses = months.reduce((s, m) => s + byMonth[m].expenses, 0) / monthsOfHistory;
    const avgUPI      = months.reduce((s, m) => s + byMonth[m].upi,      0) / monthsOfHistory;
    const avgWallet   = months.reduce((s, m) => s + byMonth[m].wallet,   0) / monthsOfHistory;
    const totalLoans  = months.reduce((s, m) => s + byMonth[m].loans,    0);

    const estimatedSavings  = Math.max(0, Math.round((avgIncome - avgExpenses) * monthsOfHistory));
    const estimatedPayments = Math.max(1, Math.round(transactions.filter(t => t.type === "debit").length / monthsOfHistory * 0.5));
    const estimatedOnTime   = Math.round(estimatedPayments * 0.88);

    const monthlyData = months.map(m => ({
      month:        byMonth[m].label,
      income:       Math.round(byMonth[m].income),
      expenses:     Math.round(byMonth[m].expenses),
      transactions: byMonth[m].transactions,
      savings:      Math.max(0, Math.round(byMonth[m].income - byMonth[m].expenses)),
    }));

    // Confidence score
    let confidence = 50;
    if (cols.date >= 0)   confidence += 10;
    if (cols.description >= 0) confidence += 10;
    if (cols.credit >= 0 && cols.debit >= 0) confidence += 15;
    if (monthsOfHistory >= 3) confidence += 10;
    if (avgIncome > 0)    confidence += 5;

    const summary: ParsedSummary = {
      monthlyIncome:       Math.round(avgIncome),
      monthlyExpenses:     Math.round(avgExpenses),
      savingsAmount:       estimatedSavings,
      upiTransactionsMonth: Math.round(avgUPI),
      digitalWalletUsage:  Math.round(avgWallet),
      onTimePayments:      estimatedOnTime,
      totalPayments:       estimatedPayments,
      loanRepayments:      Math.min(totalLoans, 12),
      loanDefaults:        0,
      monthsOfHistory,
      monthlyData,
      confidence,
      warnings: [
        ...warnings,
        `Parsed ${transactions.length} transactions across ${monthsOfHistory} month(s)`,
        "Payment reliability is estimated — verify and adjust if needed",
      ],
    };

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[CSV PARSE ERROR]", error);
    return NextResponse.json({ error: "Failed to parse: " + error.message }, { status: 500 });
  }
}
