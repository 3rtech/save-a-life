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
    db.donor.count({ where: { status: "active", stripePaymentMethodId: null } }),
    db.charge.aggregate({ where: { status: "succeeded", chargedAt: { gte: monthStart } }, _sum: { chargedAmountCents: true } }),
    db.charge.aggregate({ where: { status: "succeeded", chargedAt: { gte: yearStart } }, _sum: { chargedAmountCents: true } }),
    db.charge.count({ where: { status: "failed" } }),
    db.emergencyCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const monthTotal = monthCharged._sum.chargedAmountCents ?? 0;
  const yearTotal = yearCharged._sum.chargedAmountCents ?? 0;

  const activeDonorsList = await db.donor.findMany({
    where: { status: "active" },
    select: { perEmergencyAmountCents: true },
  });
  const estimatedCapacity = activeDonorsList.reduce((s, d) => s + d.perEmergencyAmountCents, 0);

  const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
    draft:      { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
    approved:   { bg: "#ECFDF5", color: "#065F46", label: "Approved" },
    processing: { bg: "#FEF3C7", color: "#92400E", label: "Processing" },
    completed:  { bg: "#EFF6FF", color: "#1D4ED8", label: "Completed" },
    cancelled:  { bg: "#FEF2F2", color: "#991B1B", label: "Cancelled" },
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900" style={{ fontFamily: "var(--font-lora, serif)" }}>
            Dashboard
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:brightness-110 shadow-md shadow-red-900/20"
          style={{ background: "#991B1B" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Campaign
        </Link>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Active Donors", value: activeDonors.toString(), sub: "enrolled members" },
          { label: "Est. Capacity", value: formatCents(estimatedCapacity), sub: "per emergency" },
          { label: "Charged This Month", value: formatCents(monthTotal), sub: "total disbursed" },
          { label: "Charged This Year", value: formatCents(yearTotal), sub: "total disbursed" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">{label}</div>
            <div className="text-2xl font-bold text-stone-900">{value}</div>
            <div className="text-xs text-stone-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Alert stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Failed Charges", value: failedCharges, href: "/admin/charges", alert: failedCharges > 0 },
          { label: "Paused Donors", value: pausedDonors, href: "/admin/donors", alert: false },
          { label: "Cancelled", value: cancelledDonors, href: "/admin/donors", alert: false },
          { label: "Missing Payment", value: missingPaymentDonors, href: "/admin/donors", alert: missingPaymentDonors > 0 },
        ].map(({ label, value, href, alert }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border p-4 flex items-center justify-between transition-all hover:shadow-md"
            style={{
              background: alert && value > 0 ? "#FEF2F2" : "white",
              borderColor: alert && value > 0 ? "#FECACA" : "#FED7AA",
            }}
          >
            <div className="text-xs font-medium text-stone-500">{label}</div>
            <div
              className="text-lg font-bold"
              style={{ color: alert && value > 0 ? "#991B1B" : "#1C1917" }}
            >
              {value}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-10 flex-wrap">
        {[
          { href: "/admin/invites",   label: "Invite Donors" },
          { href: "/admin/campaigns", label: "All Campaigns" },
          { href: "/admin/donors",    label: "Donor List" },
          { href: "/admin/reports",   label: "Export Reports" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-sm font-medium px-4 py-2 rounded-lg border transition-all hover:shadow-sm"
            style={{ background: "white", borderColor: "#FED7AA", color: "#1C1917" }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Recent campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-stone-800">Recent Campaigns</h2>
          <Link href="/admin/campaigns" className="text-xs text-stone-400 hover:text-stone-600">View all →</Link>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-orange-100 p-10 text-center text-stone-400 text-sm">
            No campaigns yet. Create your first emergency campaign above.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
            {recentCampaigns.map((c, i) => {
              const badge = statusBadge[c.status] ?? { bg: "#F3F4F6", color: "#6B7280", label: c.status };
              return (
                <Link
                  key={c.id}
                  href={`/admin/campaigns/${c.id}`}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-orange-50/30 transition-colors ${i !== 0 ? "border-t border-orange-50" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    <div className="text-sm font-medium text-stone-900 truncate">{c.title}</div>
                  </div>
                  <div className="text-sm font-semibold text-stone-600 shrink-0 ml-4">
                    {formatCents(c.targetAmountCents)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
