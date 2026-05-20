import { db } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  paused: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
  blocked: "bg-red-200 text-red-900",
};

export default async function DonorsPage() {
  const donors = await db.donor.findMany({
    orderBy: { createdAt: "desc" },
    include: { donorGroup: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Donors</h1>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Per Emergency</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Monthly Cap</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {donors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No donors yet.
                </td>
              </tr>
            )}
            {donors.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/donors/${d.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {d.firstName} {d.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{d.email}</td>
                <td className="px-4 py-3">{formatCents(d.perEmergencyAmountCents)}</td>
                <td className="px-4 py-3">{formatCents(d.monthlyCapCents)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {d.donorGroup?.name ?? d.signupSource ?? "public"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
