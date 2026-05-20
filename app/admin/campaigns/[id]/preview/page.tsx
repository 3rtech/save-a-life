"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type DonorRow = {
  donorId: string;
  donorName: string;
  hasPaymentMethod: boolean;
  decision: {
    shouldCharge: boolean;
    amountCents: number;
    reason: string;
  };
};

type Preview = {
  summary: {
    totalDonors: number;
    toChargeCount: number;
    skippedCapCount: number;
    missingPaymentCount: number;
    totalEstimatedCents: number;
  };
  donors: DonorRow[];
};

function formatCents(c: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

export default function PreviewPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/campaigns/${campaignId}/preview-charges`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        setPreview(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load preview.");
        setLoading(false);
      });
  }, [campaignId]);

  async function handleActivate() {
    if (!confirmed) return;
    setActivating(true);
    const res = await fetch(`/api/admin/campaigns/${campaignId}/activate`, { method: "POST" });
    if (res.ok) {
      router.push(`/admin/campaigns/${campaignId}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Activation failed.");
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading preview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
    );
  }

  if (!preview) return null;
  const { summary, donors } = preview;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/admin/campaigns/${campaignId}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Campaign
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Charge Run Preview</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Active Donors", value: summary.totalDonors },
          { label: "Will Be Charged", value: summary.toChargeCount },
          { label: "Skipped (Caps)", value: summary.skippedCapCount },
          { label: "Missing Payment", value: summary.missingPaymentCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className="text-xl font-bold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
        <div className="text-sm text-blue-800 font-medium">
          Expected total raised:{" "}
          <span className="text-xl font-bold">{formatCents(summary.totalEstimatedCents)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Donor</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Proposed Charge</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {donors.map((d) => (
              <tr key={d.donorId} className={!d.decision.shouldCharge ? "opacity-50" : ""}>
                <td className="px-4 py-3">{d.donorName}</td>
                <td className="px-4 py-3 font-medium">
                  {d.decision.shouldCharge ? formatCents(d.decision.amountCents) : "Skipped"}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {d.decision.reason.replace(/_/g, " ")}
                  {!d.hasPaymentMethod && " · no payment method"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-6">
        <p className="text-sm text-amber-900 font-medium mb-3">
          You are about to automatically charge{" "}
          <strong>{summary.toChargeCount} donors</strong> for an estimated total of{" "}
          <strong>{formatCents(summary.totalEstimatedCents)}</strong>. Donors will not be asked for
          additional approval. Charges will be processed immediately based on their pre-authorized
          limits.
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span className="text-sm text-amber-900">I understand. Continue with charges.</span>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleActivate}
        disabled={!confirmed || activating}
        className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors text-base"
      >
        {activating ? "Processing..." : "Activate Emergency Charges"}
      </button>
    </div>
  );
}
