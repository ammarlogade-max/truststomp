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
  confidence: number; // 0-100, how confident we are in the parse
  warnings: string[];
}

// Keywords to detect transaction types
const UPI_KEYWORDS = ["upi", "gpay", "phonepe", "paytm", "bhim", "neft", "imps", "razorpay", "phonepay"];
const WALLET_KEYWORDS = ["wallet", "amazon pay", "freecharge", "mobikwik", "airtel money", "jio money"];
const INCOME_KEYWORDS = ["salary", "credit", "payment received", "refund", "interest earned", "dividend", "neft cr", "imps cr"];
const LOAN_KEYWORDS = ["emi", "loan", "repayment", "mortgage", "home loan", "car loan", "personal loan"];
const EXPENSE_KEYWORDS = ["debit", "purchase", "withdrawal", "payment", "bill", "recharge"];

function detectSeparator(firstLine: string): string {
  if (firstLine.includes(",")) return ",";
  if (firstLine.includes(";")) return ";";
  if (firstLine.includes("\t")) return "\t";
  return ",";
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  // Remove currency symbols, spaces, commas
  const cleaned = raw.replace(/[₹$,\s]/g, "").replace(/[()]/g, "-");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  // Try multiple date formats
  const formats = [
    /(\d{2})[-\/](\d{2})[-\/](\d{4})/, // DD-MM-YYYY or DD/MM/YYYY
    /(\d{4})[-\/](\d{2})[-\/](\d{2})/, // YYYY-MM-DD
    /(\d{2})[-\/](\d{2})[-\/](\d{2})/,  // DD-MM-YY
  ];
  for (const fmt of formats) {
    const match = raw.match(fmt);
    if (match) {
      try {
        // Try DD-MM-YYYY first (common in India)
        const d = new Date(`${match[3]}-${match[2]}-${match[1]}`);
        if (!isNaN(d.getTime())) return d;
      } catch {}
    }
  }
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  } catch {}
  return null;
}

function isUPITransaction(desc: string): boolean {
  const lower = desc.toLowerCase();
  return UPI_KEYWORDS.some((k) => lower.includes(k));
}

function isWalletTransaction(desc: string): boolean {
  const lower = desc.toLowerCase();
  return WALLET_KEYWORDS.some((k) => lower.includes(k));
}

function isIncomeTransaction(desc: string, amount: number, type: string): boolean {
  const lower = desc.toLowerCase();
  if (type === "credit") return true;
  return INCOME_KEYWORDS.some((k) => lower.includes(k));
}

function isLoanTransaction(desc: string): boolean {
  const lower = desc.toLowerCase();
  return LOAN_KEYWORDS.some((k) => lower.includes(k));
}

function detectColumns(headers: string[]): {
  date: number; description: number; debit: number; credit: number; amount: number; balance: number;
} {
  const h = headers.map((h) => h.toLowerCase().trim());
  return {
    date: h.findIndex((x) => x.includes("date") || x.includes("txn") || x.includes("transaction date")),
    description: h.findIndex((x) => x.includes("desc") || x.includes("narration") || x.includes("particulars") || x.includes("remarks") || x.includes("details")),
    debit: h.findIndex((x) => x.includes("debit") || x.includes("dr") || x.includes("withdrawal")),
    credit: h.findIndex((x) => x.includes("credit") || x.includes("cr") || x.includes("deposit")),
    amount: h.findIndex((x) => x === "amount" || x.includes("transaction amount")),
    balance: h.findIndex((x) => x.includes("balance") || x.includes("bal")),
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
    const lines = text.split("\n").filter((l) => l.trim());

    if (lines.length < 3) {
      return NextResponse.json({ error: "File too short — needs at least a header row and 2 transactions" }, { status: 400 });
    }

    const separator = detectSeparator(lines[0]);
    const headers = lines[0].split(separator).map((h) => h.replace(/"/g, "").trim());
    const cols = detectColumns(headers);

    const warnings: string[] = [];

    if (cols.date === -1) warnings.push("Could not find date column — using row order");
    if (cols.description === -1) warnings.push("Could not find description column — transaction type detection limited");

    // Parse transactions
    const transactions: ParsedTransaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(separator).map((c) => c.replace(/"/g, "").trim());
      if (row.length < 2) continue;

      const desc = cols.description >= 0 ? (row[cols.description] || "") : row[1] || "";
      let amount = 0;
      let type: "credit" | "debit" = "debit";

      if (cols.credit >= 0 && cols.debit >= 0) {
        const credit = parseAmount(row[cols.credit]);
        const debit = parseAmount(row[cols.debit]);
        if (credit > 0) { amount = credit; type = "credit"; }
        else if (debit > 0) { amount = debit; type = "debit"; }
      } else if (cols.amount >= 0) {
        amount = parseAmount(row[cols.amount]);
        type = isIncomeTransaction(desc, amount, "") ? "credit" : "debit";
      }

      if (amount === 0) continue;

      const rawDate = cols.date >= 0 ? row[cols.date] : "";
      const date = parseDate(rawDate)?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0];

      transactions.push({ date, description: desc, amount, type });
    }

    if (transactions.length === 0) {
      return NextResponse.json({ error: "No valid transactions found. Check that your CSV has Date, Description, and Amount/Debit/Credit columns." }, { status: 400 });
    }

    // Group by month
    const byMonth: Record<string, { income: number; expenses: number; transactions: number; upi: number; wallet: number; loans: number }> = {};

    for (const tx of transactions) {
      const d = new Date(tx.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { income: 0, expenses: 0, transactions: 0, upi: 0, wallet: 0, loans: 0 };
      }

      byMonth[monthKey].transactions++;
      if (tx.type === "credit") byMonth[monthKey].income += tx.amount;
      else byMonth[monthKey].expenses += tx.amount;
      if (isUPITransaction(tx.description)) byMonth[monthKey].upi++;
      if (isWalletTransaction(tx.description)) byMonth[monthKey].wallet++;
      if (isLoanTransaction(tx.description)) byMonth[monthKey].loans++;
    }

    const months = Object.keys(byMonth).sort();
    const monthsOfHistory = months.length;

    // Calculate averages
    const avgIncome = months.reduce((s, m) => s + byMonth[m].income, 0) / monthsOfHistory;
    const avgExpenses = months.reduce((s, m) => s + byMonth[m].expenses, 0) / monthsOfHistory;
    const avgUPI = months.reduce((s, m) => s + byMonth[m].upi, 0) / monthsOfHistory;
    const avgWallet = months.reduce((s, m) => s + byMonth[m].wallet, 0) / monthsOfHistory;
    const totalLoanTx = months.reduce((s, m) => s + byMonth[m].loans, 0);

    // Estimate savings from last month balance or income - expenses
    const estimatedSavings = Math.max(0, (avgIncome - avgExpenses) * monthsOfHistory);

    // Payment reliability heuristic: assume most transactions are payments
    const totalTx = transactions.length;
    const estimatedPayments = Math.round(totalTx * 0.4); // 40% are recurring bills/payments
    const estimatedOnTime = Math.round(estimatedPayments * 0.88); // assume 88% on-time (adjustable)

    const monthlyData = months.map((m) => {
      const d = new Date(m + "-01");
      return {
        month: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        income: Math.round(byMonth[m].income),
        expenses: Math.round(byMonth[m].expenses),
        transactions: byMonth[m].transactions,
        savings: Math.max(0, Math.round(byMonth[m].income - byMonth[m].expenses)),
      };
    });

    // Confidence score based on data quality
    let confidence = 60;
    if (cols.date >= 0) confidence += 10;
    if (cols.description >= 0) confidence += 10;
    if (cols.credit >= 0 && cols.debit >= 0) confidence += 10;
    if (monthsOfHistory >= 3) confidence += 10;

    const summary: ParsedSummary = {
      monthlyIncome: Math.round(avgIncome),
      monthlyExpenses: Math.round(avgExpenses),
      savingsAmount: Math.round(estimatedSavings),
      upiTransactionsMonth: Math.round(avgUPI),
      digitalWalletUsage: Math.round(avgWallet),
      onTimePayments: estimatedOnTime,
      totalPayments: estimatedPayments,
      loanRepayments: Math.min(totalLoanTx, 12),
      loanDefaults: 0,
      monthsOfHistory,
      monthlyData,
      confidence,
      warnings: [
        ...warnings,
        `Parsed ${transactions.length} transactions across ${monthsOfHistory} month(s)`,
        "Payment reliability is estimated — please verify and adjust if needed",
      ],
    };

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[CSV PARSE ERROR]", error);
    return NextResponse.json({ error: "Failed to parse file: " + error.message }, { status: 500 });
  }
}
