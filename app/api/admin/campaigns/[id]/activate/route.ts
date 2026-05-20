import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { createAuditLog } from "@/lib/audit";

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

  await db.emergencyCampaign.update({
    where: { id: campaignId },
    data: { status: "pending_approval" },
  });

  await inngest.send({
    name: "campaign/activate",
    data: { campaignId, adminId },
  });

  await createAuditLog({
    adminId,
    action: "campaign_activate_triggered",
    entityType: "emergency_campaign",
    entityId: campaignId,
  });

  return NextResponse.json({ success: true, message: "Campaign charge run has been queued." });
}
