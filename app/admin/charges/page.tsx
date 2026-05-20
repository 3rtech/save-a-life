import { db } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import Link from "next/link";

export default async function ChargesPage() {
  const charges = await db.charge.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      donor: { select: { firstName: true, lastName: true, id: true } },
      campaign: { select: { title: true, id: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Charges</h1>
        <Link
          href="/api/admin/reports/export"
          className="border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Export CSV
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Donor</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Campaign</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {charges.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No charges yet.
                </td>
              </tr>
            )}
            {charges.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/donors/${c.donor.id}`}
                    className="text-blue-700 hover:underline"
                  >
                    {c.donor.firstName} {c.donor.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/campaigns/${c.campaign.id}`}
                    className="text-blue-700 hover:underline"
                  >
                    {c.campaign.title}
                  </Link>
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
                            : c.status === "refunded"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-yellow-100 text-yellow-800"
                    }`}
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
