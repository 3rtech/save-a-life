"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXPENSE_CATEGORIES = [
  "Treatment placement",
  "Transport",
  "Rehab",
  "Therapy",
  "Crisis intervention",
  "Other",
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    internalCaseId: "",
    description: "",
    publicMessage: "",
    targetAmount: "",
    urgencyLevel: "emergency" as "critical" | "emergency" | "urgent",
    expenseCategory: "",
    privacyLevel: "anonymous" as "anonymous" | "limited" | "internal_only",
    adminCertified: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.adminCertified) {
      setError("You must certify this emergency before proceeding.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/campaigns/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        internalCaseId: form.internalCaseId || undefined,
        description: form.description || undefined,
        publicMessage: form.publicMessage || undefined,
        targetAmountCents: Math.round(parseFloat(form.targetAmount) * 100),
        urgencyLevel: form.urgencyLevel,
        expenseCategory: form.expenseCategory || undefined,
        privacyLevel: form.privacyLevel,
        adminCertified: form.adminCertified,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create campaign.");
      setLoading(false);
    } else {
      const data = await res.json();
      router.push(`/admin/campaigns/${data.campaign.id}`);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Emergency Campaign</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Emergency Title <span className="text-red-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Emergency Intervention — Case 2024-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Internal Case ID
          </label>
          <input
            value={form.internalCaseId}
            onChange={(e) => setForm((f) => ({ ...f, internalCaseId: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target Amount ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={form.targetAmount}
            onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="20000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Urgency Level <span className="text-red-500">*</span>
          </label>
          <select
            value={form.urgencyLevel}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                urgencyLevel: e.target.value as "critical" | "emergency" | "urgent",
              }))
            }
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="critical">Critical</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expense Category</label>
          <select
            value={form.expenseCategory}
            onChange={(e) => setForm((f) => ({ ...f, expenseCategory: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— Select —</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Privacy Level</label>
          <select
            value={form.privacyLevel}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                privacyLevel: e.target.value as "anonymous" | "limited" | "internal_only",
              }))
            }
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="anonymous">Anonymous (default — case details hidden from donors)</option>
            <option value="limited">Limited (campaign title visible)</option>
            <option value="internal_only">Internal Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Internal Notes / Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Brief Case Description <span className="text-slate-400 font-normal">(included in donor notifications)</span>
          </label>
          <textarea
            value={form.publicMessage}
            onChange={(e) => setForm((f) => ({ ...f, publicMessage: e.target.value }))}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="A member of our community requires immediate intervention for substance abuse treatment..."
          />
          <p className="text-xs text-slate-400 mt-1">
            This message is sent to donors via email or text when their card is charged. Keep it brief and respect privacy. Not shown if Privacy Level is set to &quot;Internal Only&quot;.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.adminCertified}
              onChange={(e) => setForm((f) => ({ ...f, adminCertified: e.target.checked }))}
              className="mt-0.5"
            />
            <span className="text-sm text-amber-900">
              I certify that this is a legitimate emergency need and that donor charges are
              authorized under donor agreements.
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.adminCertified}
          className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {loading ? "Creating..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
}
