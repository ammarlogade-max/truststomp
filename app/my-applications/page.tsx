"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle, XCircle, Plus, FileText } from "lucide-react";

const TIER_CFG: Record<string, { color: string; text: string }> = {
  EXCELLENT:     { color: "#10b981", text: "text-emerald-400" },
  GOOD:          { color: "#3b82f6", text: "text-blue-400" },
  FAIR:          { color: "#f59e0b", text: "text-amber-400" },
  BELOW_AVERAGE: { color: "#f97316", text: "text-orange-400" },
  HIGH_RISK:     { color: "#ef4444", text: "text-red-400" },
};

const STATUS_CFG = {
  pending:  { icon: <Clock className="w-4 h-4" />,       label: "Pending Review", color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  approved: { icon: <CheckCircle className="w-4 h-4" />, label: "Approved",       color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  rejected: { icon: <XCircle className="w-4 h-4" />,    label: "Rejected",       color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/loan-applications")
      .then(r => r.json())
      .then(d => setApplications(d.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
          <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
        </div>
        <span className="font-display text-white font-semibold">TrustStomp</span>
        <span className="text-white/20 mx-1">·</span>
        <span className="text-white/40 text-sm font-body">My Applications</span>
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl text-white font-bold">My Loan Applications</h1>
            <p className="text-white/40 font-body text-sm mt-1">Track the status of your loan requests</p>
          </div>
          <Link href="/score" className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-4">
            <Plus className="w-4 h-4" /> New Application
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-white/20" />
            </div>
            <h2 className="font-display text-xl text-white font-semibold mb-2">No applications yet</h2>
            <p className="text-white/40 font-body text-sm mb-6 max-w-sm mx-auto">
              Get your Trust Score first, then apply for a loan.
            </p>
            <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Get Trust Score
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const status = STATUS_CFG[app.status as keyof typeof STATUS_CFG];
              const tier = TIER_CFG[app.riskTier] || TIER_CFG.FAIR;
              return (
                <div key={app._id} className="glass-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body border ${status.bg} ${status.color} ${status.border}`}>
                          {status.icon}{status.label}
                        </span>
                      </div>
                      <p className="text-white/30 text-xs font-body mt-1">
                        Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-bold text-white">
                        ₹{app.loanAmount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-white/30 text-xs font-body">{app.loanTenureMonths} month tenure</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-white/5 mb-4">
                    <div>
                      <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Trust Score</p>
                      <p className="font-mono font-bold" style={{ color: tier.color }}>{app.trustScore}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Grade</p>
                      <p className="text-white font-body font-medium">{app.grade}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Purpose</p>
                      <p className="text-white/70 font-body text-sm">{app.loanPurpose}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Income</p>
                      <p className="text-white/70 font-body text-sm">₹{app.monthlyIncome.toLocaleString("en-IN")}/mo</p>
                    </div>
                  </div>

                  {app.status !== "pending" && app.lenderNote && (
                    <div className={`p-3 rounded-xl text-sm font-body ${
                      app.status === "approved"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : "bg-red-500/10 border border-red-500/20 text-red-300"
                    }`}>
                      <span className="font-medium">Lender note: </span>{app.lenderNote}
                    </div>
                  )}

                  {app.status === "pending" && (
                    <p className="text-white/25 text-xs font-body">
                      Your application is being reviewed. You'll see the decision here once the lender responds.
                    </p>
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
