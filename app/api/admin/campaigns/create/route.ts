import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const schema = z.object({
  title: z.string().min(1),
  internalCaseId: z.string().optional(),
  description: z.string().optional(),
  publicMessage: z.string().optional(),
  targetAmountCents: z.number().int().min(100),
  urgencyLevel: z.enum(["critical", "emergency", "urgent"]),
  expenseCategory: z.string().optional(),
  privacyLevel: z.enum(["anonymous", "limited", "internal_only"]).default("anonymous"),
  adminCertified: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  if (!data.adminCertified) {
    return NextResponse.json({ error: "Admin certification is required" }, { status: 400 });
  }

  const adminId = (session.user as { id?: string }).id!;

  const campaign = await db.emergencyCampaign.create({
    data: {
      title: data.title,
      internalCaseId: data.internalCaseId,
      description: data.description,
      publicMessage: data.publicMessage,
      targetAmountCents: data.targetAmountCents,
      urgencyLevel: data.urgencyLevel,
      expenseCategory: data.expenseCategory,
      privacyLevel: data.privacyLevel,
      adminCertified: true,
      createdByAdminId: adminId,
      status: "draft",
    },
  });

  await createAuditLog({
    adminId,
    action: "campaign_created",
    entityType: "emergency_campaign",
    entityId: campaign.id,
    metadata: { title: data.title, urgencyLevel: data.urgencyLevel },
  });

  return NextResponse.json({ campaign });
}
