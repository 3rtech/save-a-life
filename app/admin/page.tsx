import { db } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    activeDonors,
    pausedDonors,
    cancelledDonors,
    missingPaymentDonors,
    monthCharged,
    yearCharged,
    failedCharges,
    recentCampaigns,
  ] = await Promise.all([
    db.donor.count({ where: { status: "active" } }),
    db.donor.count({ where: { status: "paused" } }),
    db.donor.count({ where: { status: "cancelled" } }),
    db.donor.count({
      where: { status: "active", stripePaymentMethodId: null },
    }),
    db.charge.aggregate({
      where: { status: "succeeded", chargedAt: { gte: monthStart } },
      _sum: { chargedAmountCents: true },
    }),
    db.charge.aggregate({
      where: { status: "succeeded", chargedAt: { gte: yearStart } },
      _sum: { chargedAmountCents: true },
    }),
    db.charge.count({ where: { status: "failed" } }),
    db.emergencyCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const monthTotal = monthCharged._sum.chargedAmountCents ?? 0;
  const yearTotal = yearCharged._sum.chargedAmountCents ?? 0;

  const activeDonorsList = await db.donor.findMany({
    where: { status: "active" },
    select: { perEmergencyAmountCents: true },
  });
  const estimatedCapacity = activeDonorsList.reduce((s, d) => s + d.perEmergencyAmountCents, 0);

  const stats = [
    { label: "Active Donors", value: activeDonors.toString() },
    { label: "Est. Emergency Capacity", value: formatCents(estimatedCapacity) },
    { label: "Charged This Month", value: formatCents(monthTotal) },
    { label: "Charged This Year", value: formatCents(yearTotal) },
    { label: "Failed Charges", value: failedCharges.toString(), alert: failedCharges > 0 },
    { label: "Paused Donors", value: pausedDonors.toString() },
    { label: "Cancelled Donors", value: cancelledDonors.toString() },
    { label: "Missing Payment Method", value: missingPaymentDonors.toString(), alert: missingPaymentDonors > 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          href="/admin/campaigns/new"
          className="bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Emergency Campaign
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, alert }) => (
          <div
            key={label}
            className={`bg-white rounded-xl border p-5 ${alert ? "border-red-300" : "border-slate-200"}`}
          >
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${alert ? "text-red-600" : "text-slate-900"}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-10 flex-wrap">
        <Link
          href="/admin/invites"
          className="border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Invite Donors
        </Link>
        <Link
          href="/admin/campaigns"
          className="border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          View Campaigns
        </Link>
        <Link
          href="/admin/reports"
          className="border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Export Reports
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Campaigns</h2>
        {recentCampaigns.length === 0 ? (
          <p className="text-slate-500 text-sm">No campaigns yet.</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {recentCampaigns.map((c) => (
              <Link
                key={c.id}
                href={`/admin/campaigns/${c.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">{c.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {c.urgencyLevel.toUpperCase()} · {c.status}
                  </div>
                </div>
                <div className="text-sm text-slate-600">{formatCents(c.targetAmountCents)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
