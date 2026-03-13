"use client";

import { useUser, useClerk, UserProfile } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  TrendingUp, Plus, Award, Settings, LogOut,
  User, Shield, Database, Trash2, AlertTriangle,
  CheckCircle, ChevronRight
} from "lucide-react";

interface StatsData {
  totalAssessments: number;
  latestScore: number | null;
  latestGrade: string | null;
  latestTier: string | null;
  firstAssessment: string | null;
}

const TIER_COLORS: Record<string, string> = {
  EXCELLENT: "#10b981", GOOD: "#3b82f6", FAIR: "#f59e0b",
  BELOW_AVERAGE: "#f97316", HIGH_RISK: "#ef4444",
};

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [stats, setStats] = useState<StatsData>({
    totalAssessments: 0, latestScore: null,
    latestGrade: null, latestTier: null, firstAssessment: null,
  });
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "data">("profile");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/score")
      .then(r => r.json())
      .then(d => {
        const list = d.assessments || [];
        if (list.length > 0) {
          const latest = list[0];
          const first = list[list.length - 1];
          setStats({
            totalAssessments: list.length,
            latestScore: latest.trustScore,
            latestGrade: latest.grade,
            latestTier: latest.riskTier,
            firstAssessment: first.createdAt,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDeleteData() {
    if (deleteInput !== "DELETE") return;
    setDeleteStatus("loading");
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStats({ totalAssessments: 0, latestScore: null, latestGrade: null, latestTier: null, firstAssessment: null });
      sessionStorage.removeItem("trustscore_result");
      sessionStorage.removeItem("trustscore_id");
      setDeleteStatus("done");
      setShowDeleteConfirm(false);
      setDeleteInput("");
    } catch {
      setDeleteStatus("error");
    }
  }

  const NavLinks = () => (
    <>
      <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-body text-sm">
        <TrendingUp className="w-4 h-4" /> Dashboard
      </Link>
      <Link href="/onboarding" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-body text-sm">
        <Plus className="w-4 h-4" /> New Assessment
      </Link>
      <Link href="/score" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all font-body text-sm">
        <Award className="w-4 h-4" /> Latest Score
      </Link>
      <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 text-white font-body text-sm">
        <Settings className="w-4 h-4 text-emerald-400" /> Settings
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

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-5 lg:p-8">
        {/* Mobile header */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xs font-mono">TS</span>
            </div>
            <span className="font-display text-white font-semibold text-sm">TrustStomp</span>
          </Link>
          <UserButton />
        </div>

        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl text-white font-bold">Settings</h1>
          <p className="text-white/40 font-body text-sm mt-1">Manage your profile, account and data</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 p-1 bg-white/5 rounded-xl w-fit">
          {([
            { id: "profile", label: "Edit Profile", icon: <User className="w-4 h-4" /> },
            { id: "account", label: "Account",      icon: <Shield className="w-4 h-4" /> },
            { id: "data",    label: "My Data",       icon: <Database className="w-4 h-4" /> },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body transition-all ${
                activeTab === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div>
            <p className="text-white/40 text-sm font-body mb-6">
              Update your name, email, password and profile picture via Clerk's secure profile editor.
            </p>
            <div className="clerk-profile-wrapper">
              <UserProfile
                appearance={{
                  elements: {
                    rootBox: { width: "100%" },
                    card: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", boxShadow: "none" },
                    navbar: { borderRight: "1px solid rgba(255,255,255,0.08)" },
                    navbarButton: { color: "rgba(255,255,255,0.5)" },
                    navbarButtonActive: { color: "white" },
                    pageScrollBox: { padding: "24px" },
                    headerTitle: { color: "white", fontFamily: "Playfair Display" },
                    headerSubtitle: { color: "rgba(255,255,255,0.4)" },
                    profileSectionTitle: { color: "rgba(255,255,255,0.6)" },
                    profileSectionContent: { color: "white" },
                    formFieldInput: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", borderRadius: "12px" },
                    formButtonPrimary: { background: "#10b981", borderRadius: "12px" },
                    badge: { background: "rgba(16,185,129,0.1)", color: "#10b981" },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === "account" && isLoaded && (
          <div className="max-w-lg space-y-5">
            <div className="glass-card p-6">
              <h2 className="font-display text-lg text-white font-semibold mb-5">Account Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-white/50 text-sm font-body">Full name</span>
                  <span className="text-white text-sm font-body">{user?.fullName || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-white/50 text-sm font-body">Email</span>
                  <span className="text-white text-sm font-body">{user?.primaryEmailAddress?.emailAddress || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-white/50 text-sm font-body">Member since</span>
                  <span className="text-white text-sm font-body">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-white/50 text-sm font-body">User ID</span>
                  <span className="text-white/30 text-xs font-mono truncate max-w-32">{user?.id?.slice(0, 20)}...</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="font-display text-lg text-white font-semibold mb-1">Sign-in Methods</h2>
              <p className="text-white/40 text-sm font-body mb-4">Connected authentication providers</p>
              <div className="space-y-2">
                {user?.externalAccounts?.map(acc => (
                  <div key={acc.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span className="text-white text-sm font-body capitalize">{acc.provider}</span>
                    <span className="text-white/30 text-xs font-body ml-auto">{acc.emailAddress || acc.username}</span>
                  </div>
                ))}
                {(user?.externalAccounts?.length ?? 0) === 0 && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span className="text-white text-sm font-body">Email / Password</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="w-full flex items-center justify-between px-5 py-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-red-400" />
                <div className="text-left">
                  <p className="text-red-300 font-body text-sm font-medium">Sign Out</p>
                  <p className="text-red-400/50 text-xs font-body">You'll be redirected to the home page</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400/50 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        )}

        {/* DATA TAB */}
        {activeTab === "data" && (
          <div className="max-w-lg space-y-5">

            {/* Stats */}
            <div className="glass-card p-6">
              <h2 className="font-display text-lg text-white font-semibold mb-5">Your Assessment Data</h2>
              {loading ? (
                <div className="text-white/30 text-sm font-body">Loading...</div>
              ) : stats.totalAssessments === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/30 font-body text-sm">No assessments on record.</p>
                  <Link href="/onboarding" className="text-emerald-400 text-sm font-body hover:text-emerald-300 transition-colors mt-2 inline-block">
                    Start your first assessment →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    ["Total assessments", stats.totalAssessments],
                    ["Latest score", stats.latestScore ? `${stats.latestScore} (${stats.latestGrade})` : "—"],
                    ["Risk tier", stats.latestTier?.replace("_", " ") || "—"],
                    ["First assessment", stats.firstAssessment ? new Date(stats.firstAssessment).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                      <span className="text-white/50 text-sm font-body">{label}</span>
                      <span className="text-white text-sm font-body font-medium"
                        style={label === "Latest score" && stats.latestTier ? { color: TIER_COLORS[stats.latestTier] } : {}}>
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy info */}
            <div className="glass-card p-6 border border-emerald-500/10">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-body text-sm font-semibold mb-2">Data Security</h3>
                  <ul className="space-y-1.5">
                    {[
                      "All data is encrypted at rest in MongoDB Atlas",
                      "Data is tied to your authenticated Clerk user ID",
                      "We never share your data with third parties",
                      "You can delete all your data at any time",
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-white/40 font-body">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400/60 shrink-0 mt-0.5" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Delete zone */}
            <div className="glass-card p-6 border border-red-500/15">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-300 font-body text-sm font-semibold">Danger Zone</h3>
                  <p className="text-red-400/50 text-xs font-body mt-1">
                    Permanently delete all your assessment data. This cannot be undone.
                  </p>
                </div>
              </div>

              {deleteStatus === "done" ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-body">
                  <CheckCircle className="w-4 h-4" /> All data deleted successfully.
                </div>
              ) : !showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-body transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete All My Data
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-white/50 text-sm font-body">Type <strong className="text-red-300 font-mono">DELETE</strong> to confirm:</p>
                  <input
                    type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="input-field border-red-500/20 focus:border-red-500/50"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                      className="btn-secondary flex-1 text-sm py-2.5">
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteData}
                      disabled={deleteInput !== "DELETE" || deleteStatus === "loading"}
                      className="flex-1 py-2.5 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-body transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {deleteStatus === "loading" ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </div>
                  {deleteStatus === "error" && (
                    <p className="text-red-400 text-xs font-body">Something went wrong. Try again.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
