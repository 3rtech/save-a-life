import { inngest } from "../client";
import { db } from "@/lib/db";
import { calculateDonorChargeAmount } from "@/lib/charge-calculator";
import { chargeOffSession } from "@/lib/stripe";
import {
  sendChargeSuccessNotifications,
  sendChargeFailedNotifications,
} from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";

export const processCampaignCharges = inngest.createFunction(
  {
    id: "process-campaign-charges",
    retries: 2,
    triggers: [{ event: "campaign/activate" }],
  },
  async ({ event, step }: { event: { data: { campaignId: string; adminId: string } }; step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    const { campaignId, adminId } = event.data;

    await step.run("lock-campaign", async () => {
      await db.emergencyCampaign.update({
        where: { id: campaignId },
        data: { status: "processing", activatedAt: new Date() },
      });
      await createAuditLog({
        adminId,
        action: "campaign_activated",
        entityType: "emergency_campaign",
        entityId: campaignId,
      });
    });

    const donors = await step.run("fetch-active-donors", async () => {
      return db.donor.findMany({
        where: {
          status: "active",
          stripeCustomerId: { not: null },
          stripePaymentMethodId: { not: null },
        },
      });
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    for (const donor of donors) {
      await step.run(`charge-donor-${donor.id}`, async () => {
        const [monthTotal, yearTotal] = await Promise.all([
          db.charge.aggregate({
            where: {
              donorId: donor.id,
              status: "succeeded",
              chargedAt: { gte: monthStart },
            },
            _sum: { chargedAmountCents: true },
          }),
          db.charge.aggregate({
            where: {
              donorId: donor.id,
              status: "succeeded",
              chargedAt: { gte: yearStart },
            },
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
          return;
        }

        const charge = await db.charge.create({
          data: {
            donorId: donor.id,
            campaignId,
            attemptedAmountCents: decision.amountCents,
            status: "pending",
          },
        });

        try {
          const intent = await chargeOffSession({
            customerId: donor.stripeCustomerId!,
            paymentMethodId: donor.stripePaymentMethodId!,
            amountCents: decision.amountCents,
            idempotencyKey: `campaign_${campaignId}_donor_${donor.id}`,
            metadata: {
              donor_id: donor.id,
              campaign_id: campaignId,
            },
          });

          await db.charge.update({
            where: { id: charge.id },
            data: {
              status: "succeeded",
              chargedAmountCents: decision.amountCents,
              stripePaymentIntentId: intent.id,
              stripeChargeId:
                typeof intent.latest_charge === "string"
                  ? intent.latest_charge
                  : (intent.latest_charge as { id?: string } | null)?.id,
              chargedAt: new Date(),
            },
          });

          const campaign = await db.emergencyCampaign.findUnique({
            where: { id: campaignId },
            select: { title: true, privacyLevel: true, publicMessage: true },
          });

          const campaignTitle =
            campaign?.privacyLevel === "anonymous"
              ? "Anonymous Emergency Case"
              : (campaign?.title ?? "Emergency Case");

          const caseDescription =
            campaign?.privacyLevel === "internal_only"
              ? null
              : (campaign?.publicMessage ?? null);

          await sendChargeSuccessNotifications({
            donor: {
              id: donor.id,
              email: donor.email,
              firstName: donor.firstName,
              phone: donor.phone,
              notificationPreference: donor.notificationPreference,
            },
            amountCents: decision.amountCents,
            campaignId,
            chargeId: charge.id,
            campaignTitle,
            caseDescription,
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          await db.charge.update({
            where: { id: charge.id },
            data: {
              status: "failed",
              failureReason: errorMessage,
            },
          });

          await sendChargeFailedNotifications({
            donor: {
              id: donor.id,
              email: donor.email,
              firstName: donor.firstName,
              phone: donor.phone,
              notificationPreference: donor.notificationPreference,
            },
            amountCents: decision.amountCents,
            campaignId,
            chargeId: charge.id,
            updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/donor/update-payment/${donor.id}`,
          });
        }
      });
    }

    await step.run("complete-campaign", async () => {
      await db.emergencyCampaign.update({
        where: { id: campaignId },
        data: { status: "completed", closedAt: new Date() },
      });
    });
  }
);
