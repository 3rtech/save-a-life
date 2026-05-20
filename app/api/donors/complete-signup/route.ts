import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  donorId: z.string().uuid(),
  stripePaymentMethodId: z.string(),
  consentVersion: z.string().default("1.0"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { donorId, stripePaymentMethodId, consentVersion } = parsed.data;

    const donor = await db.donor.findUnique({ where: { id: donorId } });
    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }
    if (donor.status !== "pending") {
      return NextResponse.json({ error: `Donor status is '${donor.status}', expected 'pending'` }, { status: 409 });
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
  } catch (err) {
    console.error("[complete-signup] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
