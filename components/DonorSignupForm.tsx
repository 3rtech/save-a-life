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
        setError(data.error ?? `Server error (${res.status}). Please try again.`);
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
        <div className="text-2xl mb-2">🧪</div>
        <p className="text-sm font-semibold text-amber-900 mb-1">Demo Mode — No real card needed</p>
        <p className="text-sm text-amber-800">
          Stripe is not connected. Click the button below to simulate a card being saved and complete your enrollment.
        </p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      <button
        onClick={handleDemo}
        disabled={loading}
        className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? "Saving..." : "Simulate Card Saved"}
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
      const data = await res.json();
      setError(data.error ?? "Signup failed.");
      setLoading(false);
    } else {
      onComplete();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Card Details</label>
        <div className="border border-slate-300 rounded-lg px-3 py-3">
          <CardElement
            options={{
              style: {
                base: { fontSize: "14px", color: "#0f172a", "::placeholder": { color: "#94a3b8" } },
              },
            }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Your card is securely stored by Stripe. We never see or store your card number.
        </p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? "Setting up..." : "Authorize My Card"}
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
        inviteToken,
        groupSlug,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setDonorId(data.donorId);
    if (data.clientSecret) {
      (window as unknown as { __setupClientSecret?: string }).__setupClientSecret = data.clientSecret;
    }
    setStep("card");
    setLoading(false);
  }

  if (step === "done") {
    router.push("/donor/thank-you");
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {isDemoMode && (
        <div className="bg-amber-400 text-amber-950 text-xs font-semibold text-center py-2 px-4">
          🧪 DEMO MODE — No real payments. For testing only.
        </div>
      )}

      <div className="border-b border-slate-200 px-6 py-4">
        <div className="font-bold text-slate-900">Save a Life</div>
        <div className="text-xs text-slate-500">Rescue a Soul</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {step === "info" ? "Join the Emergency Donor Circle" : "Secure Your Card"}
            </h1>
            <p className="text-slate-500 text-sm">
              {step === "info"
                ? "Be ready when a life is on the line."
                : "Your card will only be charged within your approved limits."}
            </p>
          </div>

          {step === "info" && (
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cell Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Giving Limits</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Per Emergency ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.perEmergencyAmount}
                      onChange={(e) => setForm((f) => ({ ...f, perEmergencyAmount: e.target.value }))}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Monthly Maximum ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.monthlyCap}
                      onChange={(e) => setForm((f) => ({ ...f, monthlyCap: e.target.value }))}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="300"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Annual Maximum ($) — optional
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.annualCap}
                    onChange={(e) => setForm((f) => ({ ...f, annualCap: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowPartialCharge}
                    onChange={(e) => setForm((f) => ({ ...f, allowPartialCharge: e.target.checked }))}
                  />
                  <span className="text-sm text-slate-600">
                    Allow partial charges if my remaining limit is less than my per-emergency amount
                  </span>
                </label>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.consentAuthorization}
                    onChange={(e) => setForm((f) => ({ ...f, consentAuthorization: e.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-slate-600">
                    I authorize Save a Life / Rescue a Soul to automatically charge my saved payment
                    method when the organization determines that an emergency crisis intervention
                    requires immediate funding. Each charge will be limited to the per-emergency
                    amount and monthly/annual maximums I selected. I understand I will not be asked
                    to approve each individual emergency charge, but I will receive notice after my
                    card is charged. I may pause or cancel future authorization at any time.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.consentCard}
                    onChange={(e) => setForm((f) => ({ ...f, consentCard: e.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-slate-600">
                    I understand that my card information is securely stored by Stripe and is not
                    directly stored by Save a Life / Rescue a Soul.
                  </span>
                </label>

                <p className="text-xs text-slate-400">
                  Donations may not be tax-deductible. Please consult your tax advisor. To protect
                  privacy, emergency details may be limited or anonymized.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? "Saving..." : "Continue to Card Setup"}
              </button>
            </form>
          )}

          {step === "card" && (
            <CardSetupStep donorId={donorId} onComplete={() => setStep("done")} />
          )}
        </div>
      </div>
    </div>
  );
}
