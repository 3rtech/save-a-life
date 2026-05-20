import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { refundCharge } from "@/lib/stripe";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: chargeId } = await params;
  const adminId = (session.user as { id?: string }).id!;

  const charge = await db.charge.findUnique({ where: { id: chargeId } });
  if (!charge || charge.status !== "succeeded" || !charge.stripeChargeId) {
    return NextResponse.json({ error: "Charge not refundable" }, { status: 400 });
  }

  await refundCharge(charge.stripeChargeId);
  await db.charge.update({
    where: { id: chargeId },
    data: { status: "refunded", refundedAt: new Date() },
  });

  await createAuditLog({
    adminId,
    action: "charge_refunded",
    entityType: "charge",
    entityId: chargeId,
    metadata: { stripeChargeId: charge.stripeChargeId },
  });

  return NextResponse.json({ success: true });
}
