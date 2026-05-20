import { db } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.emergencyCampaign.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      charges: {
        include: { donor: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) notFound();

  const succeeded = campaign.charges.filter((c) => c.status === "succeeded");
  const failed = campaign.charges.filter((c) => c.status === "failed");
  const skipped = campaign.charges.filter((c) => c.status === "skipped");
  const totalRaised = succeeded.reduce((s, c) => s + (c.chargedAmountCents ?? 0), 0);

  const canActivate = ["draft", "approved"].includes(campaign.status);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/campaigns" className="text-sm text-slate-500 hover:text-slate-800">
          ← Campaigns
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
          {campaign.internalCaseId && (
            <p className="text-sm text-slate-500 mt-1">Case #{campaign.internalCaseId}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            campaign.status === "completed"
              ? "bg-green-100 text-green-800"
              : campaign.status === "processing"
                ? "bg-orange-100 text-orange-800"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {campaign.status}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Target</div>
          <div className="text-xl font-bold">{formatCents(campaign.targetAmountCents)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Total Raised</div>
          <div className="text-xl font-bold text-green-700">{formatCents(totalRaised)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Charges</div>
          <div className="text-xl font-bold">
            {succeeded.length} success · {failed.length} failed · {skipped.length} skipped
          </div>
        </div>
      </div>

      {canActivate && (
        <div className="flex gap-3 mb-8">
          <Link
            href={`/admin/campaigns/${id}/preview`}
            className="bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Preview Charge Run
          </Link>
        </div>
      )}

      {campaign.description && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Internal Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{campaign.description}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Charge Records</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Donor</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaign.charges.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No charges yet.
                  </td>
                </tr>
              )}
              {campaign.charges.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    {c.donor.firstName} {c.donor.lastName}
                  </td>
                  <td className="px-4 py-3">
                    {c.chargedAmountCents != null ? formatCents(c.chargedAmountCents) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === "succeeded"
                          ? "bg-green-100 text-green-800"
                          : c.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : c.status === "skipped"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {c.skipReason ?? c.failureReason ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
