import React, { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Eye, EyeOff, ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { login as apiLogin, sendOtp, verifyOtp, saveTokens, getGoogleOAuthUrl } from "../lib/auth";
import { AuthPageShell, AuthVisualPanel } from "@/components/auth/AuthPageShell";
import { AuthIconBox, AuthStepIndicator, AuthSubmitButton } from "@/components/auth/AuthFormShared";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign In — Agorix" }, { name: "description", content: "Sign in to Agorix." }],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
      },
    ],
  }),
});

/* ── OTP Box Input ────────────────────────────────────────── */
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const set = (i: number, char: string) => {
    const d = char.replace(/\D/g, "").slice(-1);
    const next = Array.from({ length: 6 }, (_, idx) => value[idx] || "");
    next[i] = d;
    onChange(next.join("").replace(/\s/g, ""));
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = Array.from({ length: 6 }, (_, idx) => value[idx] || "");
        next[i] = "";
        onChange(next.join("").trimEnd());
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
      }
    }
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(p);
    refs.current[Math.min(p.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          className={`w-12 text-center text-xl font-bold border rounded-2xl outline-none transition-all duration-200
            ${
              d
                ? "bg-white/10 border-white/25 text-white shadow-sm"
                : "auth-input border text-foreground"
            }
            focus:border-primary/80 focus:ring-2 focus:ring-primary/20
            disabled:opacity-40 disabled:cursor-not-allowed`}
          style={{ height: "56px" }}
        />
      ))}
    </div>
  );
}

/* ── Step Indicator ──────────────────────────────────────── */
function StepIndicator({ step, total }: { step: number; total: number }) {
  return <AuthStepIndicator step={step} total={total} />;
}

/* ── Spinner ─────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/* ── Main ────────────────────────────────────────────────── */
function LoginPage() {
  // "credentials" → "otp" for password-based flow
  // "otp-email" → "otp" for passwordless flow
  const [step, setStep] = useState<"credentials" | "otp-email" | "otp">("credentials");
  const [flowType, setFlowType] = useState<"password" | "passwordless">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Google OAuth callback
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const at = p.get("access_token"),
      rt = p.get("refresh_token");
    if (at && rt) {
      saveTokens({
        access_token: at,
        refresh_token: rt,
        token_type: "bearer",
        user: {
          id: "",
          full_name: "",
          email: "",
          provider: "google",
          is_verified: true,
          created_at: "",
        },
      });
      toast.success("Signed in with Google!");
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(
      () =>
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(t);
            return 0;
          }
          return c - 1;
        }),
      1000,
    );
  };

  // Step 1a: password login → OTP sent
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Fill in all fields.");
      return;
    }
    setIsLoading(true);
    apiLogin(email, password)
      .then((data) => {
        toast.success(data.message);
        setFlowType("password");
        setStep("otp");
        startCountdown();
      })
      .catch((err) => toast.error(err.message || "Login failed."))
      .finally(() => setIsLoading(false));
  };

  // Step 1b: passwordless → send OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email.");
      return;
    }
    setIsLoading(true);
    sendOtp(email, "login")
      .then((data) => {
        toast.success(data.message);
        setFlowType("passwordless");
        setStep("otp");
        startCountdown();
      })
      .catch((err) => toast.error(err.message || "Failed to send code."))
      .finally(() => setIsLoading(false));
  };

  // Step 2: verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    setIsLoading(true);
    verifyOtp(email, otp, "login")
      .then(() => {
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      })
      .catch((err) => {
        toast.error(err.message || "Invalid code.");
        setOtp("");
      })
      .finally(() => setIsLoading(false));
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setIsLoading(true);
    const fn = flowType === "password" ? apiLogin(email, password) : sendOtp(email, "login");
    fn.then(() => {
      toast.success("New code sent!");
      startCountdown();
    })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  const totalSteps = flowType === "password" ? 2 : 2;
  const currentStep = step === "credentials" || step === "otp-email" ? 1 : 2;

  return (
    <AuthPageShell
      visual={
        <AuthVisualPanel>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full auth-pill mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Secure Login</span>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              Every login is
              <br />
              <span className="text-white/70">verified by email</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-[300px]">
              Even if your password is compromised, your account stays safe with mandatory email OTP
              verification on every sign-in.
            </p>
          </div>

          <div className="relative w-[260px] h-[260px] mx-auto flex items-center justify-center my-6">
            <div className="w-[240px] h-[240px] rounded-full border auth-orbital-ring absolute auth-spin-slow" />
            <div className="w-[170px] h-[170px] rounded-full border auth-orbital-ring absolute auth-spin-slow-r" />
            <div className="w-[100px] h-[100px] rounded-full border auth-orbital-ring absolute auth-spin-slow" />
            <div className="w-16 h-16 rounded-full auth-orbital-core flex items-center justify-center z-10">
              <span className="text-xl font-extrabold">λ</span>
            </div>
            {[
              { label: "Email OTP", icon: "✉", pos: "top-[4%] left-[50%] -translate-x-1/2" },
              { label: "Encrypted", icon: "🔐", pos: "top-[50%] left-[4%] -translate-y-1/2" },
              { label: "2-Step", icon: "✓✓", pos: "top-[50%] right-[4%] -translate-y-1/2" },
              { label: "Google", icon: "G", pos: "bottom-[4%] left-[50%] -translate-x-1/2" },
            ].map((b) => (
              <div
                key={b.label}
                className={`absolute ${b.pos} flex items-center gap-1.5 px-2.5 py-1.5 rounded-full auth-badge-float shadow-lg`}
              >
                <span className="text-xs">{b.icon}</span>
                <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          <div className="relative z-10 space-y-2.5">
            {[
              { step: "1", text: "Enter email & password" },
              { step: "2", text: "Receive OTP on your email" },
              { step: "✓", text: "Securely signed in" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full auth-list-dot flex items-center justify-center text-[10px] font-bold shrink-0">
                  {item.step}
                </div>
                <span className="text-[12px] text-muted-foreground font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </AuthVisualPanel>
      }
    >
      {step === "credentials" && (
        <div className="auth-fade-up">
          <StepIndicator step={1} total={2} />
          <AuthIconBox>
            <Lock className="w-5 h-5" />
          </AuthIconBox>
          <h1 className="text-[26px] font-extrabold text-foreground tracking-tight mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground font-medium mb-7">
            Enter your credentials — we'll send a verification code to confirm it's you.
          </p>

          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="user@enterprise.com"
                  className="w-full pl-10 pr-4 py-3 auth-input border focus:border-primary/70 focus:ring-2 focus:ring-primary/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground font-medium outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 auth-input border focus:border-primary/70 focus:ring-2 focus:ring-primary/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground font-medium outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AuthSubmitButton disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner />
                  Sending code…
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </AuthSubmitButton>
          </form>

          {/* Security badge */}
          <div className="mt-5 flex items-center gap-2 p-3 rounded-xl auth-note border">
            <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              A one-time verification code will be sent to your email after credentials are
              verified.
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-1 h-px bg-border" />
            <span className="px-3 text-[11px] font-semibold text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Passwordless */}
          <button
            type="button"
            onClick={() => setStep("otp-email")}
            className="auth-btn-secondary w-full py-3 border rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Sign in with email OTP only
          </button>

          {/* Google */}
          <button
            type="button"
            onClick={() => {
              window.location.href = getGoogleOAuthUrl();
            }}
            className="auth-btn-secondary mt-2 w-full py-3 border rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[12px] text-muted-foreground font-medium mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="auth-link font-bold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      )}

      {/* ── Step 1b: Passwordless email entry ── */}
      {step === "otp-email" && (
        <div className="auth-fade-up">
          <StepIndicator step={1} total={2} />
          <AuthIconBox>
            <Mail className="w-5 h-5" />
          </AuthIconBox>
          <h1 className="text-[26px] font-extrabold text-foreground tracking-tight mb-1">
            Sign in with email
          </h1>
          <p className="text-sm text-muted-foreground font-medium mb-7">
            Enter your email and we'll send a one-time code to sign you in.
          </p>

          <form className="space-y-4" onSubmit={handleSendOtp}>
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="user@enterprise.com"
                  className="w-full pl-10 pr-4 py-3 auth-input border focus:border-primary/70 focus:ring-2 focus:ring-primary/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground font-medium outline-none transition"
                />
              </div>
            </div>
            <AuthSubmitButton disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner />
                  Sending…
                </>
              ) : (
                <>
                  <span>Send Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </AuthSubmitButton>
          </form>

          <button
            onClick={() => setStep("credentials")}
            className="mt-5 text-[12px] text-muted-foreground hover:text-muted-foreground transition cursor-pointer flex items-center gap-1"
          >
            ← Back to password login
          </button>
        </div>
      )}

      {/* ── Step 2: OTP Verify ── */}
      {step === "otp" && (
        <div className="auth-fade-up">
          <StepIndicator step={2} total={2} />
          <AuthIconBox>
            <ShieldCheck className="w-5 h-5" />
          </AuthIconBox>
          <h1 className="text-[26px] font-extrabold text-foreground tracking-tight mb-1">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground font-medium mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-bold text-foreground mb-7 truncate">{email}</p>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
            <AuthSubmitButton disabled={isLoading || otp.length !== 6}>
              {isLoading ? (
                <>
                  <Spinner />
                  Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Sign In</span>
                </>
              )}
            </AuthSubmitButton>
          </form>

          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isLoading}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
            </button>
            <button
              onClick={() => {
                setStep("credentials");
                setOtp("");
              }}
              className="text-[12px] text-muted-foreground hover:text-muted-foreground transition cursor-pointer"
            >
              ← Start over
            </button>
          </div>

          {/* Code info */}
          <div className="mt-6 p-3 rounded-xl auth-input border text-[11px] text-muted-foreground leading-relaxed">
            Code expires in <span className="text-muted-foreground font-semibold">10 minutes</span>.
            Max 3 attempts before the code is invalidated.
          </div>
        </div>
      )}
    </AuthPageShell>
  );
}
