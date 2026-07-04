import React, { useState, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { register as apiRegister, verifyEmail, getGoogleOAuthUrl } from "../lib/auth";
import { AuthPageShell, AuthVisualPanel } from "@/components/auth/AuthPageShell";
import { AuthIconBox, AuthStepIndicator, AuthSubmitButton } from "@/components/auth/AuthFormShared";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Create Account — Agorix" },
      { name: "description", content: "Create your Agorix account." },
    ],
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

/* ── OTP Input ───────────────────────────────────────────── */
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

/* ── Step Indicator ─────────────────────────────────────── */
function StepIndicator({ step, total }: { step: number; total: number }) {
  return <AuthStepIndicator step={step} total={total} />;
}

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
function SignupPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

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

  const pwdChecks = [
    { label: "8+ chars", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Lowercase", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special", ok: /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password) },
  ];
  const strength = pwdChecks.filter((c) => c.ok).length;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error("Fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (strength < 5) {
      toast.error("Password doesn't meet all requirements.");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please agree to the Terms.");
      return;
    }
    setIsLoading(true);
    apiRegister(fullName, email, password)
      .then((data) => {
        toast.success(data.message);
        setStep("otp");
        startCountdown();
      })
      .catch((err) => toast.error(err.message || "Registration failed."))
      .finally(() => setIsLoading(false));
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    setIsLoading(true);
    verifyEmail(email, otp)
      .then(() => {
        toast.success("Account verified! Welcome to Agorix.");
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
    apiRegister(fullName, email, password)
      .then(() => {
        toast.success("New code sent!");
        startCountdown();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  return (
    <AuthPageShell
      minHeight={680}
      visual={
        <AuthVisualPanel>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full auth-pill mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-widest">
                Email Verified
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              Your account,
              <br />
              <span className="text-white/70">verified & secured</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-[300px]">
              We verify every new account through email OTP before activation — no bots, no fake
              accounts.
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
              { label: "Verified Email", pos: "top-[4%] left-[50%] -translate-x-1/2" },
              { label: "Encrypted", pos: "top-[50%] left-[2%] -translate-y-1/2" },
              { label: "Secure", pos: "top-[50%] right-[2%] -translate-y-1/2" },
              { label: "No Bots", pos: "bottom-[4%] left-[50%] -translate-x-1/2" },
            ].map((b) => (
              <div
                key={b.label}
                className={`absolute ${b.pos} px-2.5 py-1.5 rounded-full auth-badge-float shadow-lg`}
              >
                <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          <div className="relative z-10 space-y-2.5">
            {[
              {
                step: step === "otp" ? "✓" : "1",
                text: "Fill in your details",
                done: step === "otp",
              },
              { step: "2", text: "Verify email with OTP code", done: false },
              { step: "✓", text: "Account activated & signed in", done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all
                  ${item.done ? "auth-list-dot auth-list-dot--done" : "auth-list-dot"}`}
                >
                  {item.step}
                </div>
                <span className="text-[12px] font-medium text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </AuthVisualPanel>
      }
    >
      {step === "form" && (
        <div className="auth-fade-up">
          <StepIndicator step={1} total={2} />
          <AuthIconBox>
            <User className="w-5 h-5" />
          </AuthIconBox>
          <h1 className="text-[26px] font-extrabold text-foreground tracking-tight mb-1">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground font-medium mb-7">
            Fill in your details — we'll verify your email in the next step.
          </p>

          <form className="space-y-3.5" onSubmit={handleRegister}>
            {/* Full name */}
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 auth-input border focus:border-primary/70 focus:ring-2 focus:ring-primary/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground font-medium outline-none transition"
                />
              </div>
            </div>
            {/* Email */}
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
                  placeholder="user@enterprise.com"
                  className="w-full pl-10 pr-4 py-3 auth-input border focus:border-primary/70 focus:ring-2 focus:ring-primary/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground font-medium outline-none transition"
                />
              </div>
            </div>
            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 auth-input border focus:border-primary/70 focus:ring-2 focus:ring-primary/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground font-medium outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= strength
                            ? strength <= 2
                              ? "bg-destructive"
                              : strength <= 3
                                ? "bg-warning"
                                : "bg-success"
                            : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {pwdChecks.map((c) => (
                      <span
                        key={c.label}
                        className={`text-[10px] font-semibold ${c.ok ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {c.ok ? "✓" : "○"} {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-widest">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-10 py-3 auth-input border rounded-xl text-sm text-foreground placeholder:text-muted-foreground font-medium outline-none transition focus:ring-2 focus:ring-primary/10
                          ${confirmPassword && confirmPassword !== password ? "border-destructive/50 focus:border-destructive/70" : "focus:border-primary/70"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-destructive mt-1 font-medium">
                  Passwords do not match
                </p>
              )}
            </div>
            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-0.5">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded border-white/10 bg-secondary text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer mt-0.5 shrink-0"
              />
              <span className="text-[12px] font-medium text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <button type="button" className="auth-link font-bold hover:underline">
                  Terms
                </button>{" "}
                and{" "}
                <button type="button" className="auth-link font-bold hover:underline">
                  Privacy Policy
                </button>
              </span>
            </div>

            <AuthSubmitButton disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner />
                  Sending code…
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </AuthSubmitButton>
          </form>

          {/* Security note */}
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl auth-note border">
            <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your email will be verified with a one-time code before your account is activated.
            </p>
          </div>

          <div className="relative my-5 flex items-center">
            <div className="flex-1 h-px bg-border" />
            <span className="px-3 text-[11px] font-semibold text-muted-foreground">
              or sign up with
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.href = getGoogleOAuthUrl();
            }}
            className="auth-btn-secondary w-full py-3 border rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
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
          <p className="text-center text-[12px] text-muted-foreground font-medium mt-5">
            Already have an account?{" "}
            <Link to="/login" className="auth-link font-bold hover:underline">
              Sign in
            </Link>
          </p>
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
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground font-medium mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-bold text-foreground mb-7 truncate">{email}</p>

          <form onSubmit={handleVerify} className="space-y-6">
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
                  <span>Verify & Activate Account</span>
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
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
            <button
              onClick={() => {
                setStep("form");
                setOtp("");
              }}
              className="text-[12px] text-muted-foreground hover:text-muted-foreground transition cursor-pointer"
            >
              ← Change details
            </button>
          </div>

          <div className="mt-6 p-3 rounded-xl auth-input border text-[11px] text-muted-foreground leading-relaxed">
            Code expires in <span className="text-muted-foreground font-semibold">10 minutes</span>.
            Max 3 attempts before invalidation.
          </div>
        </div>
      )}
    </AuthPageShell>
  );
}
