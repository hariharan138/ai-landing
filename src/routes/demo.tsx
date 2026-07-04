import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Check, Loader2 } from "lucide-react";

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

export const Route = createFileRoute("/demo")({
  component: DemoPage,
  head: () => ({
    meta: [
      { title: "Schedule a Demo — RestaurantIQ" },
      {
        name: "description",
        content:
          "Book a personalized demo of RestaurantIQ. See how AI-powered analysis transforms your restaurant operations.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
      },
    ],
  }),
});

function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    restaurant: "",
    phone: "",
    posSystem: "",
    message: "",
  });

  const update =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          restaurant: form.restaurant,
          phone: form.phone,
          posSystem: form.posSystem,
          message: form.message,
          submittedAt: new Date().toISOString(),
        }),
      });

      // no-cors returns opaque response, so we can't check res.ok
      // If the fetch didn't throw, we treat it as success
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 transition";

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#111113",
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#111113]/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-white">
            λgorix
          </Link>
          <Link
            to="/restaurant-iq"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← Back to RestaurantIQ
          </Link>
        </nav>
      </header>

      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold backdrop-blur mb-6">
              <Calendar size={12} className="text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
                Book your personalized demo
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
                See RestaurantIQ in Action
              </span>
            </h1>
            <p className="text-white/60 max-w-xl mx-auto">
              Fill out the form below and we'll schedule a live walkthrough tailored to your
              restaurant's needs.
            </p>
          </div>

          <div className="mx-auto max-w-2xl">
            {submitted ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 mb-6">
                  <Check size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
                <p className="text-white/60">
                  We'll reach out within 24 hours to schedule your demo.
                </p>
                <Link
                  to="/restaurant-iq"
                  className="inline-flex items-center gap-2 mt-8 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
                >
                  Back to RestaurantIQ
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-10"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={update("firstName")}
                      className={inputClass}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={update("lastName")}
                      className={inputClass}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Work email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={update("email")}
                    className={inputClass}
                    placeholder="john@restaurant.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Restaurant name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.restaurant}
                    onChange={update("restaurant")}
                    className={inputClass}
                    placeholder="Your Restaurant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    className={inputClass}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Current POS / ERP system
                  </label>
                  <input
                    type="text"
                    value={form.posSystem}
                    onChange={update("posSystem")}
                    className={inputClass}
                    placeholder="e.g. Tally, Petpooja, Toast"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={update("message")}
                    className={`${inputClass} resize-none`}
                    placeholder="Tell us what you'd like to see in the demo..."
                  />
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-white via-white/95 to-white/60 px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Schedule My Demo
                      <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-white/40">
                  No credit card required · Free setup · We respect your privacy
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
