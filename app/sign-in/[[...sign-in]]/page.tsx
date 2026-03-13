import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-slate-900 font-bold font-mono text-lg">TS</span>
          </div>
          <h1 className="font-display text-3xl text-white font-bold">Welcome back</h1>
          <p className="text-white/40 font-body text-sm mt-2">Sign in to your TrustStomp account</p>
        </div>
        <SignIn
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: { width: "100%" },
              card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", boxShadow: "none" },
              headerTitle: { color: "white", fontFamily: "Playfair Display" },
              headerSubtitle: { color: "rgba(255,255,255,0.4)" },
              formFieldInput: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", borderRadius: "12px" },
              formButtonPrimary: { background: "#10b981", borderRadius: "12px", fontFamily: "DM Sans" },
              footerActionLink: { color: "#10b981" },
              identityPreviewText: { color: "white" },
              formFieldLabel: { color: "rgba(255,255,255,0.5)" },
              dividerLine: { background: "rgba(255,255,255,0.1)" },
              dividerText: { color: "rgba(255,255,255,0.3)" },
              socialButtonsBlockButton: { border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "white", borderRadius: "12px" },
              socialButtonsBlockButtonText: { color: "white" },
            },
          }}
        />
      </div>
    </div>
  );
}