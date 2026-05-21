"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const isDemoMode = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = isDemoMode ? null : loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Prefill = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  perEmergencyAmount?: string;
  monthlyCap?: string;
};

type Props = {
  inviteToken?: string;
  groupSlug?: string;
  signupSource?: string;
  prefill: Prefill;
};

function HeartLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16 28C16 28 4 20.5 4 11.5C4 8.42 6.42 6 9.5 6C11.24 6 12.91 6.81 14 8.09C15.09 6.81 16.76 6 18.5 6C21.58 6 24 8.42 24 11.5C24 20.5 16 28 16 28Z" />
    </svg>
  );
}

function StepIndicator({ step }: { step: "info" | "card" }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {[
        { key: "info", n: "1", label: "Your Info" },
        { key: "card", n: "2", label: "Secure Card" },
      ].map(({ key, n, label }, i) => {
        const active = step === key;
        const done = step === "card" && key === "info";
        return (
          <div key={key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className="h-px w-8"
                style={{ background: done ? "#991B1B" : "#E7E5E4" }}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  background: active || done ? "#991B1B" : "#E7E5E4",
                  color: active || done ? "white" : "#A8A29E",
                }}
              >
                {done ? "✓" : n}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: active ? "#991B1B" : "#A8A29E" }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function inputClass() {
  return "w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-800/30 transition-shadow bg-white";
}

function DemoCardStep({ donorId, onComplete }: { donorId: string; onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDemo() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/donors/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId, stripePaymentMethodId: "demo_pm_simulated" }),
      });
      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? `Server error (${res.status}). Please try again.`);
        setLoading(false);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 border text-center"
        style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "#92400E" }}>
          Demo Mode — No real card needed
        </p>
        <p className="text-sm text-amber-700">
          Stripe is not connected. Click below to simulate a card being saved and complete your enrollment.
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleDemo}
        disabled={loading}
        className="w-full text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 hover:brightness-110"
        style={{ background: "#991B1B" }}
      >
        {loading ? "Saving…" : "Simulate Card Saved"}
      </button>
    </div>
  );
}

function RealCardStep({ donorId, onComplete }: { donorId: string; onComplete: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const card = elements.getElement(CardElement);
    if (!card) return;

    const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
      (window as unknown as { __setupClientSecret?: string }).__setupClientSecret ?? "",
      { payment_method: { card } }
    );

    if (stripeError) {
      setError(stripeError.message ?? "Card setup failed.");
      setLoading(false);
      return;
    }

    const pmId =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;

    if (!pmId) {
      setError("Payment method not captured.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/donors/complete-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorId, stripePaymentMethodId: pmId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Signup failed.");
      setLoading(false);
    } else {
      onComplete();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Card Details</label>
        <div className="border border-stone-200 rounded-lg px-3 py-3 bg-white">
          <CardElement
            options={{
              style: {
                base: { fontSize: "14px", color: "#1C1917", "::placeholder": { color: "#A8A29E" } },
              },
            }}
          />
        </div>
        <p className="text-xs text-stone-400 mt-1">
          Secured by Stripe. We never see or store your card number.
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 hover:brightness-110"
        style={{ background: "#991B1B" }}
      >
        {loading ? "Setting up…" : "Authorize My Card"}
      </button>
    </form>
  );
}

function CardSetupStep({ donorId, onComplete }: { donorId: string; onComplete: () => void }) {
  if (isDemoMode) return <DemoCardStep donorId={donorId} onComplete={onComplete} />;
  return (
    <Elements stripe={stripePromise}>
      <RealCardStep donorId={donorId} onComplete={onComplete} />
    </Elements>
  );
}

export default function DonorSignupForm({ inviteToken, groupSlug, prefill }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "card" | "done">("info");
  const [donorId, setDonorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: prefill.firstName ?? "",
    lastName: prefill.lastName ?? "",
    email: prefill.email ?? "",
    phone: prefill.phone ?? "",
    perEmergencyAmount: prefill.perEmergencyAmount ?? "",
    monthlyCap: prefill.monthlyCap ?? "",
    annualCap: "",
    allowPartialCharge: false,
    notificationPreference: "email" as "email" | "sms" | "both",
    consentCard: false,
    consentAuthorization: false,
  });

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consentAuthorization || !form.consentCard) {
      setError("Please check both consent boxes to continue.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/donors/start-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          perEmergencyAmountCents: Math.round(parseFloat(form.perEmergencyAmount) * 100),
          monthlyCapCents: Math.round(parseFloat(form.monthlyCap) * 100),
          annualCapCents: form.annualCap ? Math.round(parseFloat(form.annualCap) * 100) : null,
          allowPartialCharge: form.allowPartialCharge,
          notificationPreference: form.notificationPreference,
          inviteToken,
          groupSlug,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Server error (${res.status}). Please try again.`);
        setLoading(false);
        return;
      }

      const { donorId: newDonorId, clientSecret } = data as { donorId: string; clientSecret: string | null };
      if (!newDonorId) {
        setError("Unexpected server response. Please try again.");
        setLoading(false);
        return;
      }

      setDonorId(newDonorId);
      if (clientSecret) {
        (window as unknown as { __setupClientSecret?: string }).__setupClientSecret = clientSecret;
      }
      setStep("card");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    router.push("/donor/thank-you");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFBF7" }}>
      {isDemoMode && (
        <div
          className="text-xs font-semibold text-center py-2 px-4"
          style={{ background: "#FEF3C7", color: "#92400E" }}
        >
          Demo Mode — No real payments processed.
        </div>
      )}

      {/* Header */}
      <header className="border-b border-orange-100 bg-white px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#991B1B" }}
          >
            <HeartLogo className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-stone-900 text-sm">Save a Life</span>
            <span className="text-stone-400 text-xs ml-2">· Rescue a Soul</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Hero text */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-stone-900 mb-2"
              style={{ fontFamily: "var(--font-lora, serif)" }}
            >
              {step === "info" ? "Join the Donor Circle" : "Secure Your Card"}
            </h1>
            <p className="text-stone-500 text-sm">
              {step === "info"
                ? "Choose your giving limits. We only charge when a verified emergency demands it."
                : "Your card info is handled entirely by Stripe — we never see the number."}
            </p>
          </div>

          <StepIndicator step={step} />

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-lg shadow-red-900/5 p-7">
            {step === "info" && (
              <form onSubmit={handleInfoSubmit} className="space-y-5">

                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                      First Name <span style={{ color: "#991B1B" }}>*</span>
                    </label>
                    <input
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      required
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                      Last Name <span style={{ color: "#991B1B" }}>*</span>
                    </label>
                    <input
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      required
                      className={inputClass()}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                    Email Address <span style={{ color: "#991B1B" }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className={inputClass()}
                    placeholder="you@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                    Cell Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputClass()}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {/* Giving limits */}
                <div
                  className="rounded-xl p-4 border space-y-3"
                  style={{ background: "#FFFBF7", borderColor: "#FED7AA" }}
                >
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">Giving Limits</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1.5">
                        Per Emergency ($) <span style={{ color: "#991B1B" }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.perEmergencyAmount}
                        onChange={(e) => setForm((f) => ({ ...f, perEmergencyAmount: e.target.value }))}
                        required
                        className={inputClass()}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1.5">
                        Monthly Max ($) <span style={{ color: "#991B1B" }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.monthlyCap}
                        onChange={(e) => setForm((f) => ({ ...f, monthlyCap: e.target.value }))}
                        required
                        className={inputClass()}
                        placeholder="300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5">
                      Annual Max ($) <span className="text-stone-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.annualCap}
                      onChange={(e) => setForm((f) => ({ ...f, annualCap: e.target.value }))}
                      className={inputClass()}
                    />
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allowPartialCharge}
                      onChange={(e) => setForm((f) => ({ ...f, allowPartialCharge: e.target.checked }))}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: "#991B1B" }}
                    />
                    <span className="text-xs text-stone-600">
                      Allow partial charges when my remaining limit is less than my per-emergency amount
                    </span>
                  </label>
                </div>

                {/* Notification preference */}
                <div>
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
                    Notify me when my card is charged
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["email", "sms", "both"] as const).map((opt) => {
                      const labels = { email: "Email", sms: "Text", both: "Email & Text" };
                      const active = form.notificationPreference === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, notificationPreference: opt }))}
                          className="py-2.5 px-3 rounded-lg border text-sm font-medium transition-all"
                          style={
                            active
                              ? { background: "#991B1B", borderColor: "#991B1B", color: "white" }
                              : { background: "white", borderColor: "#E7E5E4", color: "#78716C" }
                          }
                        >
                          {labels[opt]}
                        </button>
                      );
                    })}
                  </div>
                  {(form.notificationPreference === "sms" || form.notificationPreference === "both") && !form.phone && (
                    <p className="text-xs mt-1.5" style={{ color: "#B45309" }}>
                      A cell phone number is required for text notifications.
                    </p>
                  )}
                </div>

                {/* Consent */}
                <div className="space-y-3 border-t border-stone-100 pt-4">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consentAuthorization}
                      onChange={(e) => setForm((f) => ({ ...f, consentAuthorization: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded shrink-0"
                      style={{ accentColor: "#991B1B" }}
                    />
                    <span className="text-xs text-stone-600 leading-relaxed">
                      I authorize Save a Life / Rescue a Soul to automatically charge my saved payment
                      method within my approved limits when a verified emergency is declared. I understand
                      I will not be asked to approve each charge individually, but will receive notice
                      after. I may pause or cancel at any time.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consentCard}
                      onChange={(e) => setForm((f) => ({ ...f, consentCard: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded shrink-0"
                      style={{ accentColor: "#991B1B" }}
                    />
                    <span className="text-xs text-stone-600 leading-relaxed">
                      I understand my card information is securely stored by Stripe and is not
                      directly stored by Save a Life / Rescue a Soul.
                    </span>
                  </label>

                  <p className="text-xs text-stone-400">
                    Donations may not be tax-deductible. Please consult your tax advisor.
                  </p>
                </div>

                {error && (
                  <div
                    className="rounded-lg px-4 py-3 text-sm"
                    style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 hover:brightness-110 active:scale-[0.98] shadow-md shadow-red-900/20"
                  style={{ background: "#991B1B" }}
                >
                  {loading ? "Saving…" : "Continue to Card Setup →"}
                </button>
              </form>
            )}

            {step === "card" && (
              <CardSetupStep donorId={donorId} onComplete={() => setStep("done")} />
            )}
          </div>

          <p className="text-center text-xs text-stone-400 mt-5">
            Secured by Stripe · Cancel anytime · Your limits are always respected
          </p>
        </div>
      </div>
    </div>
  );
}
