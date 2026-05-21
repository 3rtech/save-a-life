"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function HeartLogo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6 text-white" aria-hidden="true">
      <path
        d="M16 28C16 28 4 20.5 4 11.5C4 8.42 6.42 6 9.5 6C11.24 6 12.91 6.81 14 8.09C15.09 6.81 16.76 6 18.5 6C21.58 6 24 8.42 24 11.5C24 20.5 16 28 16 28Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #FFFBF7 0%, #FEF2F2 60%, #FFF7ED 100%)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
          style={{ background: "#991B1B" }}
        >
          <HeartLogo />
        </div>
        <h1
          className="text-2xl font-bold text-stone-900"
          style={{ fontFamily: "var(--font-lora, serif)" }}
        >
          Save a Life
        </h1>
        <p className="text-sm text-stone-500 mt-1">Admin Portal</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-orange-100 shadow-xl shadow-red-900/5 p-8">
        <h2 className="text-lg font-semibold text-stone-900 mb-6">Sign in to your account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 transition-shadow"
              style={{ "--tw-ring-color": "#991B1B" } as React.CSSProperties}
              placeholder="admin@example.org"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 transition-shadow"
              style={{ "--tw-ring-color": "#991B1B" } as React.CSSProperties}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60 hover:brightness-110 active:scale-[0.98] mt-2"
            style={{ background: "#991B1B" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>

      <Link href="/" className="mt-8 text-sm text-stone-400 hover:text-stone-600 transition-colors">
        ← Back to homepage
      </Link>
    </div>
  );
}
