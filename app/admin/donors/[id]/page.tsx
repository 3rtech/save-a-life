import { db } from "@/lib/db";
import { formatCents } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donor = await db.donor.findUnique({
    where: { id },
    include: {
      charges: {
        include: { campaign: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      donorGroup: { select: { name: true } },
    },
  });

  if (!donor) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/donors" className="text-sm text-slate-500 hover:text-slate-800">
          ← Donors
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {donor.firstName} {donor.lastName}
      </h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Contact</h2>
          <p className="text-sm text-slate-600">{donor.email}</p>
          {donor.phone && <p className="text-sm text-slate-600">{donor.phone}</p>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Pledge Settings</h2>
          <p className="text-sm text-slate-600">
            Per emergency: <strong>{formatCents(donor.perEmergencyAmountCents)}</strong>
          </p>
          <p className="text-sm text-slate-600">
            Monthly cap: <strong>{formatCents(donor.monthlyCapCents)}</strong>
          </p>
          {donor.annualCapCents && (
            <p className="text-sm text-slate-600">
              Annual cap: <strong>{formatCents(donor.annualCapCents)}</strong>
            </p>
          )}
          <p className="text-sm text-slate-600">
            Partial charges: <strong>{donor.allowPartialCharge ? "Yes" : "No"}</strong>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Status</h2>
          <p className="text-sm text-slate-600">
            Status: <strong>{donor.status}</strong>
          </p>
          <p className="text-sm text-slate-600">
            Payment saved:{" "}
            <strong>{donor.stripePaymentMethodId ? "Yes" : "No"}</strong>
          </p>
          {donor.consentTimestamp && (
            <p className="text-sm text-slate-600">
              Consent: {new Date(donor.consentTimestamp).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Source</h2>
          <p className="text-sm text-slate-600">{donor.donorGroup?.name ?? donor.signupSource ?? "public"}</p>
          <p className="text-xs text-slate-400">Joined {new Date(donor.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Charge History</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Campaign</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {donor.charges.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No charges yet.
                  </td>
                </tr>
              )}
              {donor.charges.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">{c.campaign.title}</td>
                  <td className="px-4 py-3">
                    {c.chargedAmountCents != null ? formatCents(c.chargedAmountCents) : "—"}
                  </td>
                  <td className="px-4 py-3">{c.status}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString()}
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
