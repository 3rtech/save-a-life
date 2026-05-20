import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  donorId: z.string().uuid(),
  stripePaymentMethodId: z.string(),
  consentVersion: z.string().default("1.0"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { donorId, stripePaymentMethodId, consentVersion } = parsed.data;

  const donor = await db.donor.findUnique({ where: { id: donorId } });
  if (!donor || donor.status !== "pending") {
    return NextResponse.json({ error: "Donor not found or already active" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  await db.donor.update({
    where: { id: donorId },
    data: {
      stripePaymentMethodId,
      status: "active",
      consentVersion,
      consentTimestamp: new Date(),
      consentIpAddress: ip,
      consentUserAgent: userAgent,
    },
  });

  if (donor.inviteId) {
    await db.donorInvite.update({
      where: { id: donor.inviteId },
      data: {
        status: "used",
        usedByDonorId: donorId,
        usedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true });
}
