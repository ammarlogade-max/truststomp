import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-slate-900 font-bold font-mono text-lg">TS</span>
          </div>
          <h1 className="font-display text-3xl text-white font-bold">Create account</h1>
          <p className="text-white/40 font-body text-sm mt-2">Demo mode is enabled for local development</p>
        </div>
        <div className="glass-card p-8 text-center">
          <p className="text-white/50 font-body text-sm mb-6">
            Authentication is bypassed so you can test the app immediately.
          </p>
          <Link href="/onboarding" className="btn-primary inline-flex items-center justify-center w-full">
            Start Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
