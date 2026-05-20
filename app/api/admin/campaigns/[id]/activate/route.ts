import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { createAuditLog } from "@/lib/audit";
import { calculateDonorChargeAmount } from "@/lib/charge-calculator";

const isDemoMode = !process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: campaignId } = await params;
  const adminId = (session.user as { id?: string }).id!;

  const campaign = await db.emergencyCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  if (!["draft", "approved"].includes(campaign.status)) {
    return NextResponse.json(
      { error: `Campaign cannot be activated from status: ${campaign.status}` },
      { status: 400 }
    );
  }

  await createAuditLog({
    adminId,
    action: "campaign_activate_triggered",
    entityType: "emergency_campaign",
    entityId: campaignId,
  });

  if (isDemoMode) {
    // Process charges synchronously in demo mode (no Inngest / no Stripe needed)
    await db.emergencyCampaign.update({
      where: { id: campaignId },
      data: { status: "processing", activatedAt: new Date() },
    });

    const donors = await db.donor.findMany({ where: { status: "active" } });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    for (const donor of donors) {
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

      if (!decision.shouldCharge) {
        await db.charge.create({
          data: {
            donorId: donor.id,
            campaignId,
            attemptedAmountCents: donor.perEmergencyAmountCents,
            status: "skipped",
            skipReason: decision.reason,
          },
        });
      } else {
        // Demo: mark as succeeded immediately
        await db.charge.create({
          data: {
            donorId: donor.id,
            campaignId,
            attemptedAmountCents: decision.amountCents,
            chargedAmountCents: decision.amountCents,
            status: "succeeded",
            stripePaymentIntentId: `demo_pi_${donor.id.slice(0, 8)}`,
            chargedAt: new Date(),
          },
        });
      }
    }

    await db.emergencyCampaign.update({
      where: { id: campaignId },
      data: { status: "completed", closedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Demo charges processed successfully." });
  }

  // Production: enqueue Inngest background job
  await db.emergencyCampaign.update({
    where: { id: campaignId },
    data: { status: "pending_approval" },
  });

  await inngest.send({ name: "campaign/activate", data: { campaignId, adminId } });

  return NextResponse.json({ success: true, message: "Campaign charge run has been queued." });
}
