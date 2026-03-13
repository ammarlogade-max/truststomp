"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Shield, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, Info, Download, RefreshCw
} from "lucide-react";
import type { ScoreResult } from "@/lib/scoring-engine";

const TIER_CONFIG = {
  EXCELLENT: { color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", label: "Excellent" },
  GOOD: { color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", label: "Good" },
  FAIR: { color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", label: "Fair" },
  BELOW_AVERAGE: { color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", label: "Below Average" },
  HIGH_RISK: { color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", label: "High Risk" },
};

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const maxAngle = 0.75; // 270 degrees = 3/4 circle
  const offset = circumference - (displayScore / 1000) * circumference * maxAngle;

  useEffect(() => {
    const duration = 1500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const timeout = setTimeout(() => requestAnimationFrame(tick), 300);
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center w-52 h-52">
      <svg width="208" height="208" viewBox="0 0 208 208" className="-rotate-[135deg]">
        {/* Background track */}
        <circle
          cx="104" cy="104" r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"
          strokeDasharray={`${circumference * maxAngle} ${circumference * (1 - maxAngle)}`}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <circle
          cx="104" cy="104" r={radius}
          fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${circumference * maxAngle} ${circumference * (1 - maxAngle)}`}
          strokeDashoffset={circumference * maxAngle - (displayScore / 1000) * circumference * maxAngle}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-5xl font-bold text-white" style={{ color }}>
          {displayScore}
        </div>
        <div className="text-xs text-white/30 font-body mt-1">out of 1000</div>
      </div>
    </div>
  );
}

export default function ScorePage() {
  const router = useRouter();
  const [result, setResult] = useState<ScoreResult | null>(null);
const [assessmentId, setAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("trustscore_result");
    if (!stored) { router.push("/onboarding"); return; }
    setResult(JSON.parse(stored));
    setAssessmentId(sessionStorage.getItem("trustscore_id"));
  }, [router]);

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-white/40 font-body">Loading your results...</div>
    </div>
  );

  const tier = TIER_CONFIG[result.riskTier];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
          </div>
          <span className="font-display text-white font-semibold">TrustStomp</span>
        </Link>
        <Link href="/dashboard" className="btn-secondary text-sm py-2 px-4">
          Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero score card */}
        <div className="glass-card gradient-border p-8 md:p-12 mb-8 text-center">
          <div className="section-tag mb-6 justify-center">Assessment Complete</div>
          <h1 className="font-display text-3xl md:text-4xl text-white font-bold mb-8">
            Your Trust Score
          </h1>
          <div className="flex justify-center mb-6">
            <ScoreGauge score={result.trustScore} color={tier.color} />
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${tier.bg} border ${tier.border} ${tier.text} font-body text-sm font-medium mb-4`}>
            <Shield className="w-4 h-4" />
            {tier.label} · Grade {result.grade}
          </div>
          <p className="text-white/50 font-body text-sm max-w-lg mx-auto leading-relaxed">
            {result.recommendation}
          </p>
        </div>

        {/* Score breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <h2 className="font-display text-xl text-white font-semibold mb-5">Score Breakdown</h2>
            <div className="space-y-4">
              {Object.values(result.breakdown).map((factor: any) => (
                <div key={factor.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/70 font-body">{factor.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/30 font-body">{factor.weight}% weight</span>
                      <span className="text-sm font-mono text-white font-medium">{factor.score}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${factor.score}%`,
                        backgroundColor: factor.score >= 75 ? "#10b981" : factor.score >= 50 ? "#f59e0b" : "#ef4444"
                      }}
                    />
                  </div>
                  <p className="text-xs text-white/25 mt-1 font-body">{factor.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-display text-xl text-white font-semibold mb-5">Key Insights</h2>
            <div className="space-y-3">
              {result.insights.map((insight, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-xl ${
                  insight.type === "positive" ? "bg-emerald-500/10 border border-emerald-500/20" :
                  insight.type === "negative" ? "bg-red-500/10 border border-red-500/20" :
                  "bg-white/5 border border-white/10"
                }`}>
                  <div className="shrink-0 mt-0.5">
                    {insight.type === "positive" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                     insight.type === "negative" ? <XCircle className="w-4 h-4 text-red-400" /> :
                     <Info className="w-4 h-4 text-white/40" />}
                  </div>
                  <div>
                    <p className={`text-sm font-body ${
                      insight.type === "positive" ? "text-emerald-300" :
                      insight.type === "negative" ? "text-red-300" :
                      "text-white/60"
                    }`}>{insight.message}</p>
                    <span className={`text-xs font-body ${
                      insight.impact === "high" ? "text-white/30" : "text-white/20"
                    }`}>{insight.impact} impact</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lender view */}
        <div className="glass-card p-6 mb-8 border border-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display text-lg text-white font-semibold mb-1">Lender Assessment</h3>
              <p className="text-white/50 font-body text-sm leading-relaxed">{result.lenderAdvice}</p>
            </div>
          </div>
        </div>

        {/* Score scale */}
        <div className="glass-card p-6 mb-8">
          <h3 className="font-display text-lg text-white font-semibold mb-4">Trust Score Scale</h3>
          <div className="flex rounded-xl overflow-hidden h-3 mb-3">
            {[
              { color: "#ef4444", w: "w-[30%]" },
              { color: "#f97316", w: "w-[20%]" },
              { color: "#f59e0b", w: "w-[15%]" },
              { color: "#3b82f6", w: "w-[15%]" },
              { color: "#10b981", w: "w-[20%]" },
            ].map((s, i) => (
              <div key={i} className={`${s.w} h-full`} style={{ backgroundColor: s.color }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-white/30 font-mono">
            <span>0</span><span>300</span><span>500</span><span>650</span><span>800</span><span>1000</span>
          </div>
          <div className="flex gap-4 mt-3 flex-wrap">
            {[
              { label: "High Risk", color: "text-red-400" },
              { label: "Below Average", color: "text-orange-400" },
              { label: "Fair", color: "text-amber-400" },
              { label: "Good", color: "text-blue-400" },
              { label: "Excellent", color: "text-emerald-400" },
            ].map((t) => (
              <span key={t.label} className={`text-xs font-body ${t.color} ${result.riskTier.replace("_", " ").toLowerCase() === t.label.toLowerCase() ? "font-bold underline underline-offset-2" : ""}`}>
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              const tierColor = TIER_CONFIG[result.riskTier]?.color || "#10b981";
              const printContent = `<html><head><title>TrustStomp Report</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#111}.score{font-size:72px;font-weight:bold;color:${tierColor}}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #eee;font-size:14px}th{background:#f8f8f8}.insight{padding:8px 12px;border-left:3px solid #10b981;margin:6px 0;font-size:13px}.neg{border-color:#ef4444}footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:16px}</style></head><body><p style="color:#999;font-size:13px">TrustStomp · Alternative Credit Assessment</p><h1>Trust Score Report</h1><div class="score">${result.trustScore}</div><div style="font-size:14px;color:#666;margin-bottom:16px">out of 1000 · Grade ${result.grade} · ${TIER_CONFIG[result.riskTier]?.label}</div><h3>Score Breakdown</h3><table><tr><th>Factor</th><th>Weight</th><th>Score</th></tr>${Object.values(result.breakdown).map((f: any) => `<tr><td>${f.label}</td><td>${f.weight}%</td><td>${f.score}/100</td></tr>`).join("")}</table><h3 style="margin-top:24px">Insights</h3>${result.insights.map((ins: any) => `<div class="insight ${ins.type === "negative" ? "neg" : ""}">${ins.message}</div>`).join("")}<h3 style="margin-top:24px">Recommendation</h3><p style="font-size:14px;line-height:1.7">${result.recommendation}</p><footer>TrustStomp · ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })} · For informational purposes only.</footer></body></html>`;
              const win = window.open("", "_blank");
              if (win) { win.document.write(printContent); win.document.close(); win.print(); }
            }}
            className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF Report
          </button>
          <Link href="/dashboard" className="btn-primary flex-1 text-center inline-flex items-center justify-center gap-2">
            View Full Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/onboarding" className="btn-secondary flex-1 text-center inline-flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Re-assess
          </Link>
        </div>

        {/* Apply for loan CTA */}
        {result.riskTier !== "HIGH_RISK" && assessmentId && (
          <div className="mt-4 p-5 glass-card border border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-body font-medium text-sm">Ready to apply for a loan?</p>
              <p className="text-white/40 font-body text-xs mt-0.5">Your Trust Score qualifies you — submit an application for lender review.</p>
            </div>
            <Link
              href={`/apply?id=${assessmentId}`}
              className="btn-primary whitespace-nowrap inline-flex items-center gap-2 text-sm py-2.5 px-5"
            >
              Apply for Loan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
