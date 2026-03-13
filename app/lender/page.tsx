"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Shield, CheckCircle, XCircle, Clock, Users,
  TrendingUp, AlertTriangle, ChevronDown, ChevronUp,
  Filter, Loader2
} from "lucide-react";

const TIER_CFG: Record<string, { color: string; text: string; bg: string; border: string; label: string }> = {
  EXCELLENT:     { color: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Excellent" },
  GOOD:          { color: "#3b82f6", text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    label: "Good" },
  FAIR:          { color: "#f59e0b", text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   label: "Fair" },
  BELOW_AVERAGE: { color: "#f97316", text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  label: "Below Average" },
  HIGH_RISK:     { color: "#ef4444", text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     label: "High Risk" },
};

type FilterType = "all" | "pending" | "approved" | "rejected";

export default function LenderDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  useEffect(() => { loadApplications(); }, []);

  async function loadApplications() {
    setLoading(true);
    try {
      const res = await fetch("/api/loan-applications?role=lender");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleDecision(id: string, status: "approved" | "rejected") {
    setActionLoading(id + status);
    try {
      const res = await fetch(`/api/loan-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, lenderNote: noteInputs[id] || "" }),
      });
      if (res.ok) {
        setApplications(prev => prev.map(a => a._id === id ? { ...a, status, lenderNote: noteInputs[id] || "" } : a));
        setExpanded(null);
      }
    } catch {}
    finally { setActionLoading(null); }
  }

  const filtered = applications.filter(a => filter === "all" || a.status === filter);
  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };
  const totalRequested = applications.filter(a => a.status === "pending").reduce((s, a) => s + a.loanAmount, 0);
  const totalApproved = applications.filter(a => a.status === "approved").reduce((s, a) => s + a.loanAmount, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
          </div>
          <span className="font-display text-white font-semibold">TrustStomp</span>
          <span className="text-white/20 mx-1">·</span>
          <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-body rounded-full">Lender Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-white/40 hover:text-white text-sm font-body transition-colors">My Account</Link>
          <UserButton />
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl text-white font-bold">Lender Dashboard</h1>
          <p className="text-white/40 font-body text-sm mt-1">Review loan applications and make approval decisions based on Trust Scores</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Applications", value: counts.all, color: "text-white" },
            { label: "Pending Review", value: counts.pending, color: "text-amber-400" },
            { label: "Approved", value: counts.approved, color: "text-emerald-400" },
            { label: "Rejected", value: counts.rejected, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="glass-card p-5">
              <p className="text-white/40 text-xs font-body uppercase tracking-wider mb-2">{s.label}</p>
              <p className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Money stats */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-5 border border-amber-500/10 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white/40 text-xs font-body uppercase tracking-wider">Total Pending Amount</p>
              <p className="text-white font-display text-xl font-bold">₹{totalRequested.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="glass-card p-5 border border-emerald-500/10 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/40 text-xs font-body uppercase tracking-wider">Total Approved Amount</p>
              <p className="text-emerald-400 font-display text-xl font-bold">₹{totalApproved.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit mb-6">
          {(["all","pending","approved","rejected"] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-body capitalize transition-all flex items-center gap-2 ${
                filter === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}>
              {f} <span className="text-xs opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 font-body">No {filter === "all" ? "" : filter} applications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(app => {
              const tier = TIER_CFG[app.riskTier] || TIER_CFG.FAIR;
              const isExpanded = expanded === app._id;
              const isPending = app.status === "pending";

              return (
                <div key={app._id} className={`glass-card border transition-all ${
                  isPending ? "border-white/10" :
                  app.status === "approved" ? "border-emerald-500/20" : "border-red-500/15"
                }`}>
                  {/* Main row */}
                  <div className="p-5 flex items-center gap-4">
                    {/* Score circle */}
                    <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
                      <span className="font-mono font-bold text-lg leading-none" style={{ color: tier.color }}>{app.trustScore}</span>
                      <span className="text-xs font-body" style={{ color: `${tier.color}80` }}>{app.grade}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-body font-medium text-sm">{app.name || "Anonymous"}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${tier.bg} ${tier.text} ${tier.border}`}>{tier.label}</span>
                      </div>
                      <p className="text-white/30 text-xs font-body truncate">{app.email}</p>
                      <p className="text-white/40 text-xs font-body mt-0.5">{app.loanPurpose} · {app.loanTenureMonths}m tenure</p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-white font-display text-xl font-bold">₹{app.loanAmount.toLocaleString("en-IN")}</p>
                      <p className="text-white/30 text-xs font-body">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      {app.status === "pending" ? (
                        <span className="flex items-center gap-1.5 text-amber-400 text-xs font-body bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      ) : app.status === "approved" ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-body bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 text-xs font-body bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg">
                          <XCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      )}
                    </div>

                    {/* Expand toggle */}
                    <button onClick={() => setExpanded(isExpanded ? null : app._id)}
                      className="text-white/30 hover:text-white transition-colors shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-5">
                      {/* Score breakdown */}
                      <div className="grid sm:grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-white/40 text-xs font-body uppercase tracking-wider mb-3">Score Breakdown</p>
                          <div className="space-y-2.5">
                            {app.breakdown && Object.values(app.breakdown).map((f: any) => (
                              <div key={f.label}>
                                <div className="flex justify-between text-xs font-body mb-1">
                                  <span className="text-white/60">{f.label}</span>
                                  <span className="text-white font-medium">{f.score}/100 <span className="text-white/25">({f.weight}%)</span></span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full"
                                    style={{ width: `${f.score}%`, backgroundColor: f.score >= 75 ? "#10b981" : f.score >= 50 ? "#f59e0b" : "#ef4444" }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs font-body uppercase tracking-wider mb-3">Financial Profile</p>
                          <div className="space-y-2">
                            {[
                              ["Monthly Income", `₹${app.monthlyIncome.toLocaleString("en-IN")}`],
                              ["Monthly Expenses", `₹${app.monthlyExpenses.toLocaleString("en-IN")}`],
                              ["Savings", `₹${app.savingsAmount.toLocaleString("en-IN")}`],
                              ["Expense Ratio", `${Math.round((app.monthlyExpenses / Math.max(app.monthlyIncome, 1)) * 100)}%`],
                            ].map(([l, v]) => (
                              <div key={String(l)} className="flex justify-between text-sm font-body py-1.5 border-b border-white/5 last:border-0">
                                <span className="text-white/40">{l}</span>
                                <span className="text-white font-medium">{v}</span>
                              </div>
                            ))}
                          </div>
                          {app.insights?.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {app.insights.slice(0, 3).map((ins: any, i: number) => (
                                <p key={i} className={`text-xs font-body px-2 py-1.5 rounded-lg ${
                                  ins.type === "positive" ? "bg-emerald-500/10 text-emerald-400/80" :
                                  ins.type === "negative" ? "bg-red-500/10 text-red-400/80" :
                                  "bg-white/5 text-white/40"
                                }`}>{ins.message}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Decision panel - only for pending */}
                      {isPending && (
                        <div className="border-t border-white/5 pt-5">
                          <p className="text-white/40 text-xs font-body uppercase tracking-wider mb-3">Decision</p>
                          <textarea
                            className="input-field text-sm mb-4 resize-none"
                            rows={2}
                            placeholder="Optional note to applicant (e.g. reason for rejection, conditions for approval...)"
                            value={noteInputs[app._id] || ""}
                            onChange={e => setNoteInputs(prev => ({ ...prev, [app._id]: e.target.value }))}
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleDecision(app._id, "approved")}
                              disabled={!!actionLoading}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-body text-sm transition-all disabled:opacity-40"
                            >
                              {actionLoading === app._id + "approved"
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <CheckCircle className="w-4 h-4" />}
                              Approve Loan
                            </button>
                            <button
                              onClick={() => handleDecision(app._id, "rejected")}
                              disabled={!!actionLoading}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl font-body text-sm transition-all disabled:opacity-40"
                            >
                              {actionLoading === app._id + "rejected"
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <XCircle className="w-4 h-4" />}
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Already decided */}
                      {!isPending && app.lenderNote && (
                        <div className={`border-t border-white/5 pt-4 text-sm font-body ${
                          app.status === "approved" ? "text-emerald-300" : "text-red-300"
                        }`}>
                          <span className="font-medium">Your note: </span>{app.lenderNote}
                          <span className="text-white/25 ml-2 text-xs">
                            · {new Date(app.reviewedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
