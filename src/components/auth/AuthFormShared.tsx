import React from "react";

export function AuthStepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-7">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className={`auth-step-dot ${
              i + 1 < step
                ? "auth-step-dot--done"
                : i + 1 === step
                  ? "auth-step-dot--active"
                  : "auth-step-dot--pending"
            }`}
          >
            {i + 1 < step ? "✓" : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`h-px transition-all duration-500 ${
                i + 1 < step ? "auth-step-line--done" : "auth-step-line--pending"
              }`}
              style={{ width: 28 }}
            />
          )}
        </React.Fragment>
      ))}
      <span className="ml-1 text-[11px] font-medium text-muted-foreground">
        Step {step} of {total}
      </span>
    </div>
  );
}

export function AuthIconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-12 h-12 rounded-2xl auth-icon-box flex items-center justify-center mb-5">
      {children}
    </div>
  );
}

export function AuthSubmitButton({
  disabled,
  children,
}: {
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="auth-btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
    >
      {children}
    </button>
  );
}
