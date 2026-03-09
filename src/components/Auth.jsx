import { useState } from "react";
import { supabase } from "../lib/supabase";

// ---------------------------------------------------------------------------
// SRM email validation – only @srmist.edu.in addresses may register
// ---------------------------------------------------------------------------
const SRM_EMAIL_REGEX = /@srmist\.edu\.in$/i;

// ---------------------------------------------------------------------------
// AuthModal – renders a centred modal with Login / Sign-Up tabs
// Props:
//   onClose()          – called when the user dismisses the modal
//   onSuccess(user)    – called after a successful login or sign-up
// ---------------------------------------------------------------------------
export default function AuthModal({ onClose, onSuccess, initialTab = "login" }) {
  const [tab, setTab]         = useState(initialTab); // "login" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [info, setInfo]       = useState(null);

  // ── Validation ──────────────────────────────────────────────────────────
  function validate() {
    if (!email.trim())    return "Please enter your email address.";
    if (tab === "signup" && !SRM_EMAIL_REGEX.test(email))
      return "Only @srmist.edu.in email addresses are allowed to sign up.";
    if (!password)        return "Please enter your password.";
    if (tab === "signup" && password.length < 6)
      return "Password must be at least 6 characters.";
    return null;
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);

    if (tab === "login") {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (sbError) { setError(sbError.message); return; }
      onSuccess?.(data.user);
      onClose?.();
    } else {
      const { data, error: sbError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (sbError) { setError(sbError.message); return; }

      // Supabase may require email confirmation – check for a live session
      if (data?.session) {
        onSuccess?.(data.user);
        onClose?.();
      } else {
        // Email confirmation required – tell the user
        setInfo(
          "Account created! Check your @srmist.edu.in inbox to confirm your email, then log in."
        );
      }
    }
  }

  // ── Switch tabs helper ───────────────────────────────────────────────────
  function switchTab(newTab) {
    setTab(newTab);
    setError(null);
    setInfo(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl shadow">
            🎓
          </div>
          <span className="mt-2 text-lg font-extrabold text-slate-900">
            What&apos;s <span className="text-indigo-600">Up</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
            SRM Campus Events
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {[
            { key: "login",  label: "Log In" },
            { key: "signup", label: "Sign Up" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-150
                ${tab === key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-indigo-600"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tab === "signup" ? "you@srmist.edu.in" : "your@email.com"}
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200">
              <span className="mt-px shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Info message (email confirmation) */}
          {info && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <span className="mt-px shrink-0">✅</span>
              <span>{info}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : tab === "login"
              ? "Log In →"
              : "Create Account →"}
          </button>
        </form>

        {/* SRM email hint */}
        {tab === "signup" && (
          <p className="mt-5 text-center text-xs text-slate-400">
            Registration is restricted to{" "}
            <span className="font-semibold text-indigo-500">@srmist.edu.in</span>{" "}
            email addresses.
          </p>
        )}
      </div>
    </div>
  );
}
