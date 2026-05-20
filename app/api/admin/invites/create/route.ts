import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

const schema = z.object({
  inviteType: z.enum(["public", "private", "group"]),
  groupSlug: z.string().optional(),
  groupName: z.string().optional(),
  invitedFirstName: z.string().optional(),
  invitedLastName: z.string().optional(),
  invitedEmail: z.string().email().optional(),
  invitedPhone: z.string().optional(),
  suggestedPerEmergencyAmountCents: z.number().int().optional(),
  suggestedMonthlyCapCents: z.number().int().optional(),
  suggestedAnnualCapCents: z.number().int().optional(),
  expiresAt: z.string().datetime().optional(),
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
  const adminId = (session.user as { id?: string }).id!;

  let donorGroupId: string | undefined;

  if (data.inviteType === "group") {
    if (!data.groupSlug || !data.groupName) {
      return NextResponse.json({ error: "Group slug and name are required for group invites" }, { status: 400 });
    }
    let group = await db.donorGroup.findUnique({ where: { slug: data.groupSlug } });
    if (!group) {
      group = await db.donorGroup.create({
        data: {
          name: data.groupName,
          slug: data.groupSlug,
          sourceLabel: data.groupSlug,
          createdByAdminId: adminId,
        },
      });
    }
    donorGroupId = group.id;
  }

  const token = generateToken();
  const invite = await db.donorInvite.create({
    data: {
      inviteToken: token,
      inviteType: data.inviteType,
      donorGroupId,
      invitedFirstName: data.invitedFirstName,
      invitedLastName: data.invitedLastName,
      invitedEmail: data.invitedEmail,
      invitedPhone: data.invitedPhone,
      suggestedPerEmergencyAmountCents: data.suggestedPerEmergencyAmountCents,
      suggestedMonthlyCapCents: data.suggestedMonthlyCapCents,
      suggestedAnnualCapCents: data.suggestedAnnualCapCents,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdByAdminId: adminId,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url =
    data.inviteType === "group" && data.groupSlug
      ? `${appUrl}/join/${data.groupSlug}`
      : `${appUrl}/invite/${token}`;

  await createAuditLog({
    adminId,
    action: "invite_created",
    entityType: "donor_invite",
    entityId: invite.id,
    metadata: { inviteType: data.inviteType, token },
  });

  return NextResponse.json({ invite, url });
}
