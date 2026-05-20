"use client";

import { useState } from "react";

type InviteType = "public" | "private" | "group";

export default function InvitesPage() {
  const [inviteType, setInviteType] = useState<InviteType>("public");
  const [form, setForm] = useState({
    groupSlug: "",
    groupName: "",
    invitedFirstName: "",
    invitedLastName: "",
    invitedEmail: "",
    invitedPhone: "",
    suggestedPerEmergencyAmount: "",
    suggestedMonthlyCap: "",
  });
  const [result, setResult] = useState<{ url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const payload: Record<string, unknown> = { inviteType };
    if (inviteType === "group") {
      payload.groupSlug = form.groupSlug;
      payload.groupName = form.groupName;
    }
    if (inviteType === "private") {
      payload.invitedFirstName = form.invitedFirstName;
      payload.invitedLastName = form.invitedLastName;
      payload.invitedEmail = form.invitedEmail;
      payload.invitedPhone = form.invitedPhone;
      if (form.suggestedPerEmergencyAmount)
        payload.suggestedPerEmergencyAmountCents = Math.round(parseFloat(form.suggestedPerEmergencyAmount) * 100);
      if (form.suggestedMonthlyCap)
        payload.suggestedMonthlyCapCents = Math.round(parseFloat(form.suggestedMonthlyCap) * 100);
    }

    const res = await fetch("/api/admin/invites/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create invite.");
    } else {
      const data = await res.json();
      setResult({ url: data.url });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Invite Link</h1>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl border border-slate-200 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Invite Type</label>
          <div className="flex gap-3">
            {(["public", "private", "group"] as InviteType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setInviteType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  inviteType === t
                    ? "bg-blue-800 text-white border-blue-800"
                    : "border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {inviteType === "group" && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
              <input
                value={form.groupName}
                onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Lakewood Shul"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Group Slug (used in URL)
              </label>
              <input
                value={form.groupSlug}
                onChange={(e) => setForm((f) => ({ ...f, groupSlug: e.target.value }))}
                required
                pattern="[a-z0-9-]+"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="lakewood"
              />
            </div>
          </>
        )}

        {inviteType === "private" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  value={form.invitedFirstName}
                  onChange={(e) => setForm((f) => ({ ...f, invitedFirstName: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  value={form.invitedLastName}
                  onChange={(e) => setForm((f) => ({ ...f, invitedLastName: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.invitedEmail}
                onChange={(e) => setForm((f) => ({ ...f, invitedEmail: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                value={form.invitedPhone}
                onChange={(e) => setForm((f) => ({ ...f, invitedPhone: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Suggested Per-Emergency ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.suggestedPerEmergencyAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, suggestedPerEmergencyAmount: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Suggested Monthly Cap ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.suggestedMonthlyCap}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, suggestedMonthlyCap: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-4">
            <p className="text-sm font-medium text-green-800 mb-2">Invite link created:</p>
            <div className="bg-white border border-green-300 rounded px-3 py-2 text-sm font-mono break-all text-slate-700">
              {result.url}
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(result.url)}
              className="mt-2 text-xs text-green-700 hover:text-green-900 underline"
            >
              Copy to clipboard
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {loading ? "Creating..." : "Create Invite Link"}
        </button>
      </form>
    </div>
  );
}
