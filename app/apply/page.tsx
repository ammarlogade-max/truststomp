"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle,
  DollarSign, Target, Calendar, Shield, AlertCircle
} from "lucide-react";

const PURPOSES = [
  "Business / MSME",
  "Education",
  "Medical Emergency",
  "Home Improvement",
  "Agriculture / Farm Equipment",
  "Vehicle Purchase",
  "Debt Consolidation",
  "Personal / Family",
  "Other",
];

const TENURES = [3, 6, 12, 18, 24, 36, 48, 60];

const TIER_CFG: Record<string, { color: string; text: string; bg: string; border: string; label: string; maxLoan: number }> = {
  EXCELLENT:     { color: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Excellent",     maxLoan: 500000 },
  GOOD:          { color: "#3b82f6", text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    label: "Good",          maxLoan: 200000 },
  FAIR:          { color: "#f59e0b", text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   label: "Fair",          maxLoan: 50000  },
  BELOW_AVERAGE: { color: "#f97316", text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  label: "Below Average", maxLoan: 25000  },
  HIGH_RISK:     { color: "#ef4444", text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     label: "High Risk",     maxLoan: 0      },
};

export default function ApplyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [scoreData, setScoreData] = useState<any>(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [loanTenure, setLoanTenure] = useState("12");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load score from sessionStorage
    const stored = sessionStorage.getItem("trustscore_result");
    if (stored) {
      setScoreData(JSON.parse(stored));
    } else if (!assessmentId) {
      router.push("/onboarding");
    }
  }, [router, assessmentId]);

  async function handleSubmit() {
    if (!loanAmount || !loanPurpose || !loanTenure) {
      setError("Please fill in all fields.");
      return;
    }
    if (!assessmentId) {
      setError("No assessment found. Please complete your Trust Score first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/loan-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          loanAmount: parseFloat(loanAmount),
          loanPurpose,
          loanTenureMonths: parseInt(loanTenure),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!scoreData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const tier = TIER_CFG[scoreData.riskTier] || TIER_CFG.FAIR;
  const emi = loanAmount && loanTenure
    ? Math.round((parseFloat(loanAmount) * 1.12) / parseInt(loanTenure))
    : 0;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="font-display text-3xl text-white font-bold mb-3">Application Submitted!</h1>
          <p className="text-white/50 font-body text-sm leading-relaxed mb-8">
            Your loan application has been submitted successfully. A lender will review your Trust Score and financial profile and respond soon.
          </p>
          <div className="glass-card p-5 mb-8 text-left space-y-3">
            <div className="flex justify-between text-sm font-body">
              <span className="text-white/40">Loan Amount</span>
              <span className="text-white font-medium">₹{parseFloat(loanAmount).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-white/40">Purpose</span>
              <span className="text-white font-medium">{loanPurpose}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-white/40">Tenure</span>
              <span className="text-white font-medium">{loanTenure} months</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-white/40">Trust Score</span>
              <span className="font-medium" style={{ color: tier.color }}>{scoreData.trustScore} ({scoreData.grade})</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-white/40">Status</span>
              <span className="text-amber-400 font-medium">⏳ Pending Review</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="btn-primary text-center">Go to Dashboard</Link>
            <Link href="/my-applications" className="btn-secondary text-center">View My Applications</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <Link href="/score" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
          <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
        </div>
        <span className="font-display text-white font-semibold">TrustStomp</span>
        <span className="text-white/20 mx-1">·</span>
        <span className="text-white/40 text-sm font-body">Loan Application</span>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">

        {/* Score summary */}
        <div className={`glass-card p-5 mb-8 border ${tier.border} flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${tier.color}15` }}>
            <Shield className="w-7 h-7" style={{ color: tier.color }} />
          </div>
          <div className="flex-1">
            <p className="text-white/40 text-xs font-body uppercase tracking-wider mb-0.5">Your Trust Score</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold" style={{ color: tier.color }}>{scoreData.trustScore}</span>
              <span className="text-white/30 font-body text-sm">/ 1000</span>
              <span className={`text-sm font-body font-medium ${tier.text}`}>· {tier.label} · Grade {scoreData.grade}</span>
            </div>
          </div>
          {tier.maxLoan > 0 ? (
            <div className="text-right shrink-0">
              <p className="text-white/30 text-xs font-body">Max eligible</p>
              <p className="text-white font-mono font-bold text-lg">₹{(tier.maxLoan).toLocaleString("en-IN")}</p>
            </div>
          ) : (
            <div className="text-right shrink-0">
              <p className="text-red-400 text-xs font-body">Not eligible</p>
              <p className="text-red-400/60 text-xs font-body mt-0.5">Improve score first</p>
            </div>
          )}
        </div>

        {tier.maxLoan === 0 ? (
          <div className="glass-card p-8 text-center border border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="font-display text-xl text-white font-semibold mb-2">Not Eligible for Loans</h2>
            <p className="text-white/40 font-body text-sm mb-6 leading-relaxed">
              Your current Trust Score is in the High Risk tier. Improve your score by building payment history and digital activity before applying.
            </p>
            <Link href="/dashboard" className="btn-secondary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="glass-card gradient-border p-8">
            <h2 className="font-display text-2xl text-white font-bold mb-1">Loan Application</h2>
            <p className="text-white/40 text-sm font-body mb-8">Fill in your loan requirements. A lender will review and decide based on your Trust Score.</p>

            <div className="space-y-6">
              {/* Loan Amount */}
              <div>
                <label className="label-text flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" /> Loan Amount (₹) *
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder={`e.g. 50000 (max ₹${tier.maxLoan.toLocaleString("en-IN")})`}
                  value={loanAmount}
                  onChange={e => setLoanAmount(e.target.value)}
                  max={tier.maxLoan}
                />
                {loanAmount && parseFloat(loanAmount) > tier.maxLoan && (
                  <p className="text-red-400 text-xs font-body mt-1">
                    Exceeds your eligible limit of ₹{tier.maxLoan.toLocaleString("en-IN")}
                  </p>
                )}
              </div>

              {/* Purpose */}
              <div>
                <label className="label-text flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Loan Purpose *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {PURPOSES.map(p => (
                    <button
                      key={p}
                      onClick={() => setLoanPurpose(p)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-body text-left transition-all border ${
                        loanPurpose === p
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenure */}
              <div>
                <label className="label-text flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Repayment Tenure *
                </label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {TENURES.map(t => (
                    <button
                      key={t}
                      onClick={() => setLoanTenure(String(t))}
                      className={`py-2.5 rounded-xl text-xs font-body transition-all border ${
                        loanTenure === String(t)
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {t < 12 ? `${t}m` : `${t / 12}yr`}
                    </button>
                  ))}
                </div>
              </div>

              {/* EMI preview */}
              {emi > 0 && (
                <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs font-body uppercase tracking-wider">Estimated Monthly EMI</p>
                    <p className="text-white font-display text-2xl font-bold mt-0.5">₹{emi.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-xs font-body">Total repayment</p>
                    <p className="text-white/70 font-mono text-sm mt-0.5">₹{(emi * parseInt(loanTenure)).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-body flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !loanAmount || !loanPurpose || !loanTenure || parseFloat(loanAmount) > tier.maxLoan}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed py-4"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Loan Application <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <p className="text-white/20 text-xs font-body text-center mt-3">
                  Your Trust Score and financial profile will be shared with lenders for review.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
