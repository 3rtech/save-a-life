import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateDonorChargeAmount } from "@/lib/charge-calculator";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: campaignId } = await params;
  const campaign = await db.emergencyCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const donors = await db.donor.findMany({ where: { status: "active" } });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const results = await Promise.all(
    donors.map(async (donor) => {
      const [monthTotal, yearTotal] = await Promise.all([
        db.charge.aggregate({
          where: { donorId: donor.id, status: "succeeded", chargedAt: { gte: monthStart } },
          _sum: { chargedAmountCents: true },
        }),
        db.charge.aggregate({
          where: { donorId: donor.id, status: "succeeded", chargedAt: { gte: yearStart } },
          _sum: { chargedAmountCents: true },
        }),
      ]);

      const decision = calculateDonorChargeAmount({
        perEmergencyAmountCents: donor.perEmergencyAmountCents,
        monthlyCapCents: donor.monthlyCapCents,
        annualCapCents: donor.annualCapCents,
        monthToDateChargedCents: monthTotal._sum.chargedAmountCents ?? 0,
        yearToDateChargedCents: yearTotal._sum.chargedAmountCents ?? 0,
        allowPartialCharge: donor.allowPartialCharge,
      });

      const hasPaymentMethod = !!(donor.stripeCustomerId && donor.stripePaymentMethodId);

      return {
        donorId: donor.id,
        donorName: `${donor.firstName} ${donor.lastName}`,
        decision,
        hasPaymentMethod,
      };
    })
  );

  const toCharge = results.filter((r) => r.decision.shouldCharge && r.hasPaymentMethod);
  const skippedCap = results.filter((r) => !r.decision.shouldCharge);
  const missingPayment = results.filter((r) => r.decision.shouldCharge && !r.hasPaymentMethod);
  const totalEstimated = toCharge.reduce((s, r) => s + r.decision.amountCents, 0);

  return NextResponse.json({
    summary: {
      totalDonors: donors.length,
      toChargeCount: toCharge.length,
      skippedCapCount: skippedCap.length,
      missingPaymentCount: missingPayment.length,
      totalEstimatedCents: totalEstimated,
    },
    donors: results,
  });
}
