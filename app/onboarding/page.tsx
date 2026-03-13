"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, CheckCircle, DollarSign, CreditCard,
  Smartphone, TrendingUp, Loader2, Upload, FileText,
  AlertCircle, CheckCircle2, X, Sparkles
} from "lucide-react";

interface FormData {
  monthlyIncome: string;
  monthlyExpenses: string;
  savingsAmount: string;
  upiTransactionsMonth: string;
  digitalWalletUsage: string;
  onTimePayments: string;
  totalPayments: string;
  loanRepayments: string;
  loanDefaults: string;
  monthsOfHistory: string;
  monthlyData: MonthlyEntry[];
}

interface MonthlyEntry {
  month: string;
  income: string;
  expenses: string;
  transactions: string;
  savings: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const steps = [
  { id: 1, title: "Income & Expenses", icon: <DollarSign className="w-4 h-4" />, desc: "Your monthly financial overview" },
  { id: 2, title: "Payment History",   icon: <CreditCard className="w-4 h-4" />,  desc: "Bills, loans & repayments" },
  { id: 3, title: "Digital Activity",  icon: <Smartphone className="w-4 h-4" />,  desc: "UPI & wallet behavior" },
  { id: 4, title: "Monthly Breakdown", icon: <TrendingUp className="w-4 h-4" />,  desc: "Last N months snapshot" },
];

function generateMonths(count: number): MonthlyEntry[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return { month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, income: "", expenses: "", transactions: "", savings: "" };
  });
}

const defaultForm: FormData = {
  monthlyIncome: "", monthlyExpenses: "", savingsAmount: "",
  upiTransactionsMonth: "", digitalWalletUsage: "",
  onTimePayments: "", totalPayments: "",
  loanRepayments: "", loanDefaults: "",
  monthsOfHistory: "6", monthlyData: generateMonths(6),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "upload" | "manual">("choose");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [csvConfidence, setCsvConfidence] = useState(0);
  const [error, setError] = useState("");

  const set = (key: keyof FormData, val: string) => setForm(f => ({ ...f, [key]: val }));
  const setMonthly = (idx: number, key: keyof MonthlyEntry, val: string) =>
    setForm(f => { const md = [...f.monthlyData]; md[idx] = { ...md[idx], [key]: val }; return { ...f, monthlyData: md }; });
  const n = (s: string) => parseFloat(s) || 0;

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/parse-csv", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      const s = data.summary;
      setForm({
        monthlyIncome: String(s.monthlyIncome),
        monthlyExpenses: String(s.monthlyExpenses),
        savingsAmount: String(s.savingsAmount),
        upiTransactionsMonth: String(s.upiTransactionsMonth),
        digitalWalletUsage: String(s.digitalWalletUsage),
        onTimePayments: String(s.onTimePayments),
        totalPayments: String(s.totalPayments),
        loanRepayments: String(s.loanRepayments),
        loanDefaults: String(s.loanDefaults),
        monthsOfHistory: String(s.monthsOfHistory),
        monthlyData: s.monthlyData.map((m: any) => ({
          month: m.month,
          income: String(m.income),
          expenses: String(m.expenses),
          transactions: String(m.transactions),
          savings: String(m.savings),
        })),
      });
      setCsvWarnings(s.warnings || []);
      setCsvConfidence(s.confidence || 0);
      setMode("manual");
      setStep(1);
    } catch (err: any) {
      setError(err.message || "Could not parse file. Try manual entry.");
    } finally {
      setCsvLoading(false);
      // Reset file input
      e.target.value = "";
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        monthlyIncome: n(form.monthlyIncome),
        monthlyExpenses: n(form.monthlyExpenses),
        savingsAmount: n(form.savingsAmount),
        upiTransactionsMonth: n(form.upiTransactionsMonth),
        digitalWalletUsage: n(form.digitalWalletUsage),
        onTimePayments: n(form.onTimePayments),
        totalPayments: n(form.totalPayments),
        loanRepayments: n(form.loanRepayments),
        loanDefaults: n(form.loanDefaults),
        monthsOfHistory: n(form.monthsOfHistory),
        monthlyData: form.monthlyData.map(m => ({
          month: m.month,
          income: n(m.income), expenses: n(m.expenses),
          transactions: n(m.transactions), savings: n(m.savings),
        })),
      };
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
      sessionStorage.setItem("trustscore_result", JSON.stringify(data.result));
      sessionStorage.setItem("trustscore_id", data.assessmentId);
      router.push("/score");
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canNext = () => {
    if (step === 1) return form.monthlyIncome && form.monthlyExpenses;
    if (step === 2) return form.totalPayments && form.onTimePayments;
    if (step === 3) return form.upiTransactionsMonth;
    return true;
  };

  const expRatio = form.monthlyIncome && form.monthlyExpenses && n(form.monthlyIncome) > 0
    ? n(form.monthlyExpenses) / n(form.monthlyIncome) : 0;

  // ── CHOOSE MODE SCREEN ──
  if (mode === "choose") {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
          </div>
          <span className="font-display text-white font-semibold">TrustStomp</span>
          <span className="text-white/20 mx-2">·</span>
          <span className="text-white/40 text-sm font-body">New Assessment</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center mb-10">
            <div className="section-tag mb-4 justify-center">
              <Sparkles className="w-3 h-3" /> Get Your Trust Score
            </div>
            <h1 className="font-display text-4xl text-white font-bold mb-3">
              How would you like to start?
            </h1>
            <p className="text-white/40 font-body text-sm max-w-md mx-auto">
              Upload your bank statement for instant auto-fill, or enter data manually.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 w-full max-w-2xl">
            {/* Upload option */}
            <label className="glass-card gradient-border p-7 flex flex-col cursor-pointer hover:border-emerald-500/30 transition-all group relative overflow-hidden">
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVUpload} disabled={csvLoading} />
              <div className="absolute top-3 right-3">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-body">Recommended</span>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-500/20 transition-colors">
                {csvLoading ? <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /> : <Upload className="w-6 h-6 text-emerald-400" />}
              </div>
              <h3 className="font-display text-lg text-white font-semibold mb-2">
                {csvLoading ? "Analysing..." : "Upload Bank Statement"}
              </h3>
              <p className="text-white/40 font-body text-sm leading-relaxed mb-5">
                Upload a CSV from your bank or GPay/PhonePe. We auto-fill everything in seconds.
              </p>
              <div className="space-y-1.5 mt-auto">
                {["HDFC, SBI, ICICI bank CSV", "GPay / PhonePe export", "Any standard bank statement"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-white/30 font-body">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400/60 shrink-0" />{f}
                  </div>
                ))}
              </div>
            </label>

            {/* Manual option */}
            <button
              onClick={() => setMode("manual")}
              className="glass-card p-7 flex flex-col text-left hover:border-white/20 transition-all group"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors">
                <FileText className="w-6 h-6 text-white/40 group-hover:text-white/60 transition-colors" />
              </div>
              <h3 className="font-display text-lg text-white font-semibold mb-2">Enter Manually</h3>
              <p className="text-white/40 font-body text-sm leading-relaxed mb-5">
                Fill in your financial details step-by-step using a guided 4-step form.
              </p>
              <div className="space-y-1.5 mt-auto">
                {["4 short steps", "Takes about 3 minutes", "Full control over your data"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-white/30 font-body">
                    <CheckCircle2 className="w-3 h-3 text-white/20 shrink-0" />{f}
                  </div>
                ))}
              </div>
            </button>
          </div>

          {error && (
            <div className="mt-6 w-full max-w-2xl p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-body flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Could not parse file</p>
                <p className="text-red-400/70 mt-0.5">{error}</p>
                <button onClick={() => { setError(""); setMode("manual"); }} className="text-red-300 underline underline-offset-2 mt-2 text-xs">
                  Continue with manual entry instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MANUAL / REVIEW MODE ──
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
          </div>
          <span className="font-display text-white font-semibold">TrustStomp</span>
          <span className="text-white/20 mx-1">·</span>
          <span className="text-white/40 text-sm font-body">Assessment</span>
        </div>
        <button onClick={() => setMode("choose")} className="text-white/30 hover:text-white/60 text-xs font-body flex items-center gap-1.5 transition-colors">
          <X className="w-3.5 h-3.5" /> Change method
        </button>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">

        {/* CSV success banner */}
        {csvWarnings.length > 0 && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-body text-sm font-medium">
                  Bank statement imported — {csvConfidence}% confidence
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {csvWarnings.map((w, i) => (
                <p key={i} className="text-emerald-400/60 text-xs font-body">· {w}</p>
              ))}
            </div>
            <p className="text-white/30 text-xs font-body mt-2">Review and adjust the pre-filled values below if needed.</p>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
                  step === s.id
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : step > s.id
                    ? "text-emerald-400/60 cursor-pointer hover:text-emerald-400"
                    : "text-white/20 cursor-default"
                }`}
              >
                {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : s.icon}
                <span className="hidden sm:block">{s.title}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`h-px w-4 shrink-0 ${step > s.id ? "bg-emerald-500/40" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <div className="glass-card gradient-border p-8">
          <h2 className="font-display text-2xl text-white font-bold mb-1">{steps[step - 1].title}</h2>
          <p className="text-white/40 text-sm font-body mb-7">{steps[step - 1].desc}</p>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-text">Monthly Income (₹) *</label>
                  <input type="number" className="input-field" placeholder="e.g. 35000"
                    value={form.monthlyIncome} onChange={e => set("monthlyIncome", e.target.value)} />
                  <p className="text-xs text-white/25 mt-1 font-body">Salary, freelance, business</p>
                </div>
                <div>
                  <label className="label-text">Monthly Expenses (₹) *</label>
                  <input type="number" className="input-field" placeholder="e.g. 22000"
                    value={form.monthlyExpenses} onChange={e => set("monthlyExpenses", e.target.value)} />
                  <p className="text-xs text-white/25 mt-1 font-body">Rent, food, transport, bills</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-text">Total Savings (₹)</label>
                  <input type="number" className="input-field" placeholder="e.g. 50000"
                    value={form.savingsAmount} onChange={e => set("savingsAmount", e.target.value)} />
                </div>
                <div>
                  <label className="label-text">Months of History</label>
                  <select className="input-field" value={form.monthsOfHistory}
                    onChange={e => { set("monthsOfHistory", e.target.value); setForm(f => ({ ...f, monthlyData: generateMonths(parseInt(e.target.value)) })); }}>
                    {[3,6,9,12,18,24].map(n => <option key={n} value={n}>{n} months</option>)}
                  </select>
                </div>
              </div>
              {expRatio > 0 && (
                <div className={`p-4 rounded-xl text-sm font-body ${
                  expRatio > 1 ? "bg-red-500/10 border border-red-500/20 text-red-400" :
                  expRatio > 0.8 ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                  "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                }`}>
                  Expense ratio: {Math.round(expRatio * 100)}% —{" "}
                  {expRatio <= 0.7 ? "Excellent spending control 💪" : expRatio <= 0.85 ? "Moderate spending" : "High expense ratio ⚠️"}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-text">Total Payments Made *</label>
                  <input type="number" className="input-field" placeholder="e.g. 48"
                    value={form.totalPayments} onChange={e => set("totalPayments", e.target.value)} />
                  <p className="text-xs text-white/25 mt-1 font-body">Rent, EMI, subscriptions</p>
                </div>
                <div>
                  <label className="label-text">On-Time Payments *</label>
                  <input type="number" className="input-field" placeholder="e.g. 45"
                    value={form.onTimePayments} onChange={e => set("onTimePayments", e.target.value)} />
                  <p className="text-xs text-white/25 mt-1 font-body">Paid before due date</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-text">Loan Repayments Completed</label>
                  <input type="number" className="input-field" placeholder="e.g. 2"
                    value={form.loanRepayments} onChange={e => set("loanRepayments", e.target.value)} />
                </div>
                <div>
                  <label className="label-text">Loan Defaults / Missed EMIs</label>
                  <input type="number" className="input-field" placeholder="e.g. 0"
                    value={form.loanDefaults} onChange={e => set("loanDefaults", e.target.value)} />
                </div>
              </div>
              {form.totalPayments && form.onTimePayments && (
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex justify-between text-sm font-body mb-2">
                    <span className="text-white/50">Payment reliability</span>
                    <span className="text-white font-medium">{Math.round((n(form.onTimePayments) / n(form.totalPayments)) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (n(form.onTimePayments) / n(form.totalPayments)) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-text">UPI Transactions / Month *</label>
                  <input type="number" className="input-field" placeholder="e.g. 25"
                    value={form.upiTransactionsMonth} onChange={e => set("upiTransactionsMonth", e.target.value)} />
                  <p className="text-xs text-white/25 mt-1 font-body">GPay, PhonePe, Paytm</p>
                </div>
                <div>
                  <label className="label-text">Digital Wallet Transactions / Month</label>
                  <input type="number" className="input-field" placeholder="e.g. 10"
                    value={form.digitalWalletUsage} onChange={e => set("digitalWalletUsage", e.target.value)} />
                  <p className="text-xs text-white/25 mt-1 font-body">Paytm wallet, Amazon Pay</p>
                </div>
              </div>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                <p className="text-emerald-400/80 text-sm font-body leading-relaxed">
                  💡 <strong>Why we ask this:</strong> Regular digital transactions show financial activity and build trust without needing a bank statement.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-white/40 text-sm font-body mb-2">
                Monthly data for the last {form.monthsOfHistory} months — helps us measure consistency.
                Leave blank to use your averages from Step 1.
              </p>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {form.monthlyData.map((m, i) => (
                  <div key={m.month} className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-xs font-mono text-emerald-400 mb-3">{m.month}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(["income","expenses","transactions","savings"] as const).map(field => (
                        <div key={field}>
                          <label className="label-text capitalize">{field}</label>
                          <input type="number" className="input-field py-2 text-xs"
                            placeholder={field === "transactions" ? "count" : "₹"}
                            value={m[field]} onChange={e => setMonthly(i, field, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-body flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button onClick={() => step === 1 ? setMode("choose") : setStep(s => s - 1)}
            className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />{step === 1 ? "Back" : "Back"}
          </button>

          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-70">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Calculating...</> : <>Generate Score <ArrowRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
