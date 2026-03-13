"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Plus, Award, Settings, Shield,
  AlertTriangle, RefreshCw, Menu, X
} from "lucide-react";

interface Assessment {
  _id: string;
  trustScore: number;
  grade: string;
  riskTier: string;
  createdAt: string;
  breakdown?: Record<string, { score: number; weight: number; label: string; detail: string }>;
  insights?: Array<{ type: string; message: string; impact: string }>;
  recommendation?: string;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  savingsAmount?: number;
}

const TIER_CFG: Record<string, { color: string; text: string; bg: string; border: string; label: string }> = {
  EXCELLENT:    { color: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Excellent" },
  GOOD:         { color: "#3b82f6", text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    label: "Good" },
  FAIR:         { color: "#f59e0b", text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   label: "Fair" },
  BELOW_AVERAGE:{ color: "#f97316", text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  label: "Below Average" },
  HIGH_RISK:    { color: "#ef4444", text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     label: "High Risk" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-body shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbWarning, setDbWarning] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/score");
        const data = await res.json();
        if (data.dbError) setDbWarning(true);
        let list: Assessment[] = data.assessments || [];

        // sessionStorage fallback
        if (list.length === 0) {
          const stored = sessionStorage.getItem("trustscore_result");
          if (stored) {
            const r = JSON.parse(stored);
            list = [{
              _id: "local",
              trustScore: r.trustScore,
              grade: r.grade,
              riskTier: r.riskTier,
              createdAt: new Date().toISOString(),
              breakdown: r.breakdown,
              insights: r.insights,
              recommendation: r.recommendation,
            }];
          }
        }
        setAssessments(list);
      } catch {
        setDbWarning(true);
        const stored = sessionStorage.getItem("trustscore_result");
        if (stored) {
          const r = JSON.parse(stored);
          setAssessments([{
            _id: "local", trustScore: r.trustScore, grade: r.grade,
            riskTier: r.riskTier, createdAt: new Date().toISOString(),
            breakdown: r.breakdown, insights: r.insights,
          }]);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const latest = assessments[0];
  const tier = latest ? (TIER_CFG[latest.riskTier] || TIER_CFG.FAIR) : null;

  const chartData = [...assessments].reverse().map((a, i) => ({
    name: `#${i + 1}`,
    date: new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    score: a.trustScore,
  }));

  const radarData = latest?.breakdown
    ? Object.values(latest.breakdown).map(f => ({ subject: f.label.split(" ")[0], value: f.score, fullMark: 100 }))
    : [];

  const barData = assessments.slice(0, 6).reverse().map(a => ({
    date: new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    Income: a.monthlyIncome || 0,
    Expenses: a.monthlyExpenses || 0,
    Savings: a.savingsAmount || 0,
  }));

  const NavLinks = () => (
    <>
      <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 text-white font-body text-sm">
        <TrendingUp className="w-4 h-4 text-emerald-400" /> Dashboard
      </Link>
      <Link href="/onboarding" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-body text-sm">
        <Plus className="w-4 h-4" /> New Assessment
      </Link>
      <Link href="/score" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-body text-sm">
        <Award className="w-4 h-4" /> Latest Score
      </Link>
      <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-body text-sm">
        <Settings className="w-4 h-4" /> Settings
      </Link>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-white/5 p-5">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
          </div>
          <span className="font-display text-white font-semibold">TrustStomp</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <NavLinks />
        </nav>
        <div className="pt-4 border-t border-white/5 flex items-center gap-3">
          <UserButton />
          {isLoaded && (
            <div className="min-w-0">
              <p className="text-white text-xs font-body truncate">{user?.fullName || "User"}</p>
              <p className="text-white/30 text-xs font-body truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
          </div>
          <span className="font-display text-white font-semibold text-sm">TrustStomp</span>
        </div>
        <div className="flex items-center gap-3">
          <UserButton />
          <button onClick={() => setMobileNavOpen(o => !o)} className="text-white/50 hover:text-white transition-colors">
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-14">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <nav className="relative bg-slate-950 border-b border-white/10 p-5 flex flex-col gap-1">
            <NavLinks />
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:p-8 p-5 pt-20 lg:pt-8">

        {dbWarning && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300/80 text-sm font-body">
              Database offline — showing local data. Fix <code className="font-mono text-amber-300 text-xs bg-amber-500/10 px-1 py-0.5 rounded">MONGODB_URI</code> in .env.local and whitelist your IP in Atlas.
            </p>
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-white font-bold">
              {isLoaded ? `Hello, ${user?.firstName || "there"} 👋` : "Dashboard"}
            </h1>
            <p className="text-white/40 font-body text-sm mt-1">Your financial trust profile</p>
          </div>
          <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5">
            <Plus className="w-4 h-4" /> New Assessment
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-white/30 text-sm font-body">Loading your data...</p>
            </div>
          </div>
        ) : assessments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-white/20" />
            </div>
            <h2 className="font-display text-xl text-white font-semibold mb-2">No assessments yet</h2>
            <p className="text-white/40 font-body text-sm mb-6 max-w-sm mx-auto">
              Complete your first Trust Score assessment to see your financial profile here.
            </p>
            <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Start Assessment
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Top stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5">
                <p className="text-white/40 text-xs font-body uppercase tracking-wider mb-2">Trust Score</p>
                <p className="font-display text-3xl font-bold" style={{ color: tier?.color }}>{latest.trustScore}</p>
                <p className={`text-xs font-body mt-1 ${tier?.text}`}>{tier?.label} · {latest.grade}</p>
              </div>
              <div className="glass-card p-5">
                <p className="text-white/40 text-xs font-body uppercase tracking-wider mb-2">Assessments</p>
                <p className="font-display text-3xl font-bold text-white">{assessments.length}</p>
                <p className="text-xs text-white/30 font-body mt-1">Total completed</p>
              </div>
              <div className="glass-card p-5">
                <p className="text-white/40 text-xs font-body uppercase tracking-wider mb-2">Score Change</p>
                {assessments.length >= 2 ? (
                  <>
                    <p className={`font-display text-3xl font-bold ${assessments[0].trustScore >= assessments[1].trustScore ? "text-emerald-400" : "text-red-400"}`}>
                      {assessments[0].trustScore >= assessments[1].trustScore ? "+" : ""}{assessments[0].trustScore - assessments[1].trustScore}
                    </p>
                    <p className="text-xs text-white/30 font-body mt-1">vs last assessment</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-3xl font-bold text-white/20">—</p>
                    <p className="text-xs text-white/30 font-body mt-1">Need 2+ assessments</p>
                  </>
                )}
              </div>
              <div className="glass-card p-5">
                <p className="text-white/40 text-xs font-body uppercase tracking-wider mb-2">Member Since</p>
                <p className="font-display text-lg font-bold text-white">
                  {new Date(assessments[assessments.length - 1].createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
                <p className="text-xs text-white/30 font-body mt-1">First assessment</p>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Score history */}
              <div className="glass-card p-6">
                <h2 className="font-display text-lg text-white font-semibold mb-5">Score History</h2>
                {chartData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 1000]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fill="url(#scoreGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-white/20 text-sm font-body">
                    Complete 2+ assessments to see trend
                  </div>
                )}
              </div>

              {/* Factor radar */}
              <div className="glass-card p-6">
                <h2 className="font-display text-lg text-white font-semibold mb-5">Factor Analysis</h2>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                      <Radar name="Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center text-white/20 text-sm font-body">No data</div>
                )}
              </div>
            </div>

            {/* Score breakdown + Insights */}
            {latest.breakdown && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h2 className="font-display text-lg text-white font-semibold mb-5">Score Breakdown</h2>
                  <div className="space-y-4">
                    {Object.values(latest.breakdown).map(f => (
                      <div key={f.label}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm text-white/70 font-body">{f.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/25 font-body">{f.weight}%</span>
                            <span className="text-sm font-mono text-white">{f.score}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${f.score}%`, backgroundColor: f.score >= 75 ? "#10b981" : f.score >= 50 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h2 className="font-display text-lg text-white font-semibold mb-5">Insights</h2>
                  <div className="space-y-3">
                    {(latest.insights || []).slice(0, 5).map((ins, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-sm font-body ${
                        ins.type === "positive" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" :
                        ins.type === "negative" ? "bg-red-500/10 border-red-500/20 text-red-300" :
                        "bg-white/5 border-white/10 text-white/60"
                      }`}>
                        {ins.message}
                        <span className="block text-xs opacity-50 mt-0.5">{ins.impact} impact</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Financial overview bar chart */}
            {barData.some(d => d.Income > 0) && (
              <div className="glass-card p-6">
                <h2 className="font-display text-lg text-white font-semibold mb-5">Financial Overview</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} barCategoryGap="30%">
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Income" fill="#10b981" radius={[3,3,0,0]} />
                    <Bar dataKey="Expenses" fill="#f59e0b" radius={[3,3,0,0]} />
                    <Bar dataKey="Savings" fill="#3b82f6" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* History table */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg text-white font-semibold">Assessment History</h2>
                <Link href="/onboarding" className="text-xs text-emerald-400 hover:text-emerald-300 font-body flex items-center gap-1.5 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Re-assess
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Date","Score","Grade","Tier",""].map(h => (
                        <th key={h} className="text-left py-2.5 px-2 text-white/30 text-xs uppercase tracking-wider font-body">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assessments.map(a => {
                      const t = TIER_CFG[a.riskTier] || TIER_CFG.FAIR;
                      return (
                        <tr key={a._id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-2 text-white/50">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td className="py-3 px-2 font-mono font-bold" style={{ color: t.color }}>{a.trustScore}</td>
                          <td className="py-3 px-2 text-white/70">{a.grade}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${t.bg} ${t.text} border ${t.border}`}>{t.label}</span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            {a._id === "local" ? (
                              <span className="text-xs text-white/20 font-body">local</span>
                            ) : (
                              <Link href="/score" className="text-xs text-white/30 hover:text-emerald-400 transition-colors">View →</Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendation */}
            {latest.recommendation && (
              <div className="glass-card p-6 border border-emerald-500/10">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-base text-white font-semibold mb-1">Lender Recommendation</h3>
                    <p className="text-white/50 font-body text-sm leading-relaxed">{latest.recommendation}</p>
                    <Link href="/onboarding" className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-body mt-3 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Improve your score
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
