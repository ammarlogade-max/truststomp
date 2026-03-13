"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, BarChart3, TrendingUp, CheckCircle, Globe } from "lucide-react";

export default function LandingPage() {
  const isSignedIn = false;

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "No Bank History Required",
      desc: "We use your digital transaction patterns, UPI behavior, and payment consistency to build your profile.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Trusted by Lenders",
      desc: "Our Trust Score gives financial institutions a reliable, explainable view of your creditworthiness.",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Real-Time Scoring",
      desc: "Get your Trust Score in seconds using our AI-powered weighted scoring engine.",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Track Your Progress",
      desc: "Monitor improvements in your financial health over time with beautiful dashboards.",
    },
  ];

  const stats = [
    { value: "190M+", label: "Unbanked Indians" },
    { value: "0–1000", label: "Trust Score Range" },
    { value: "5", label: "Scoring Factors" },
    { value: "Real-Time", label: "Score Generation" },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-bold text-sm font-mono">TS</span>
          </div>
          <span className="font-display text-white font-semibold text-lg tracking-tight">TrustStomp</span>
        </div>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link href="/dashboard" className="btn-primary text-sm py-2 px-4">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="nav-link">Sign In</Link>
              <Link href="/sign-up" className="btn-primary text-sm py-2 px-5">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center">
          <div className="section-tag mb-6">
            <Globe className="w-3 h-3" />
            Built for HackStomp 2026 · FinTech Domain
          </div>
          <h1 className="font-display text-5xl md:text-7xl text-white font-bold leading-tight mb-6">
            Your Financial
            <br />
            <span className="text-emerald-400">Trust Score</span>
            <br />
            <span className="text-white/40">Starts Here.</span>
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-body leading-relaxed">
            190 million Indians have no credit history. TrustStomp changes that —
            we score your financial behavior from digital transactions, UPI patterns,
            and payment consistency. No bank required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className="btn-primary inline-flex items-center gap-2">
              Get Your Trust Score Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary inline-flex items-center gap-2">
              How It Works
            </Link>
          </div>
        </div>

        {/* Floating score card preview */}
        <div className="mt-20 flex justify-center">
          <div className="glass-card gradient-border p-8 max-w-sm w-full text-center glow-green animate-[fade-up_0.8s_ease-out_0.3s_both]">
            <div className="text-xs text-white/40 font-body uppercase tracking-wider mb-4">Sample Trust Score</div>
            <div className="text-8xl font-display font-bold text-emerald-400 mb-2">742</div>
            <div className="text-white/60 font-body text-sm mb-4">Good · Grade B+</div>
            <div className="space-y-2">
              {[
                { label: "Payment Reliability", pct: 87 },
                { label: "Transaction Consistency", pct: 72 },
                { label: "Income Stability", pct: 80 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-36 text-left font-body">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/60 font-mono w-8">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 md:px-12 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.value} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/40 font-body">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="section-tag mb-4">The Technology</div>
          <h2 className="font-display text-4xl md:text-5xl text-white font-bold mb-4">
            How TrustStomp Works
          </h2>
          <p className="text-white/40 text-lg font-body max-w-xl mx-auto">
            A weighted 5-factor model inspired by FICO, built for India's digital economy.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-6 hover:border-emerald-500/20 transition-colors duration-300">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-display text-xl text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-white/50 font-body text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring factors */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="glass-card gradient-border p-8 md:p-12">
          <div className="section-tag mb-6">Scoring Breakdown</div>
          <h2 className="font-display text-3xl md:text-4xl text-white font-bold mb-8">
            5 Factors. One Score.
          </h2>
          <div className="space-y-4">
            {[
              { label: "Payment Reliability", pct: 35, desc: "On-time payment ratio + loan behavior" },
              { label: "Transaction Consistency", pct: 25, desc: "Regular digital financial activity" },
              { label: "Income Stability", pct: 20, desc: "Monthly income variance and growth trend" },
              { label: "Spending Discipline", pct: 15, desc: "Expense-to-income ratio, savings rate" },
              { label: "Digital Footprint", pct: 5, desc: "Breadth of digital payment platforms" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white font-body">{item.label}</span>
                    <span className="text-sm font-mono text-emerald-400">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      style={{ width: `${item.pct * 2.5}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/30 mt-1 font-body">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-12 text-center">
        <h2 className="font-display text-4xl md:text-5xl text-white font-bold mb-6">
          Ready to build your
          <br />
          financial identity?
        </h2>
        <p className="text-white/40 font-body text-lg mb-10 max-w-md mx-auto">
          It takes less than 5 minutes. No bank account. No credit card.
        </p>
        <Link href={isSignedIn ? "/onboarding" : "/sign-up"} className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
          Start For Free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
            </div>
            <span className="font-display text-white/60 text-sm">TrustStomp</span>
          </div>
          <p className="text-white/30 text-xs font-body text-center">
            Built for HackStomp 2026 · FinTech Domain · PS: HS_PS-1 Alternative Credit Scoring
          </p>
        </div>
      </footer>
    </div>
  );
}
