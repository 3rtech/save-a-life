import { db } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  processing: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

const URGENCY_COLORS: Record<string, string> = {
  critical: "text-red-700 font-bold",
  emergency: "text-orange-700 font-semibold",
  urgent: "text-yellow-700",
};

export default async function CampaignsPage() {
  const campaigns = await db.emergencyCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { charges: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Emergency Campaigns</h1>
        <Link
          href="/admin/campaigns/new"
          className="bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Campaign
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Title</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Urgency</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Target</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No campaigns yet.
                </td>
              </tr>
            )}
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/campaigns/${c.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {c.title}
                  </Link>
                  {c.internalCaseId && (
                    <span className="ml-2 text-xs text-slate-400">#{c.internalCaseId}</span>
                  )}
                </td>
                <td className={`px-4 py-3 uppercase text-xs ${URGENCY_COLORS[c.urgencyLevel]}`}>
                  {c.urgencyLevel}
                </td>
                <td className="px-4 py-3">{formatCents(c.targetAmountCents)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
