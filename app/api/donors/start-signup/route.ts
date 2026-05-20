import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createCustomer, createSetupIntent } from "@/lib/stripe";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  perEmergencyAmountCents: z.number().int().min(100),
  monthlyCapCents: z.number().int().min(100),
  annualCapCents: z.number().int().optional().nullable(),
  allowPartialCharge: z.boolean(),
  inviteToken: z.string().optional(),
  groupSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  let inviteId: string | undefined;
  let donorGroupId: string | undefined;

  if (data.inviteToken) {
    const invite = await db.donorInvite.findUnique({
      where: { inviteToken: data.inviteToken },
    });
    if (!invite || invite.status !== "active") {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
    }
    inviteId = invite.id;
    if (invite.donorGroupId) donorGroupId = invite.donorGroupId;
  }

  if (data.groupSlug && !donorGroupId) {
    const group = await db.donorGroup.findUnique({ where: { slug: data.groupSlug } });
    if (group) donorGroupId = group.id;
  }

  const customer = await createCustomer({
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
    phone: data.phone,
    metadata: { source: "save-a-life-signup" },
  });

  const setupIntent = await createSetupIntent(customer.id);

  const donor = await db.donor.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      stripeCustomerId: customer.id,
      perEmergencyAmountCents: data.perEmergencyAmountCents,
      monthlyCapCents: data.monthlyCapCents,
      annualCapCents: data.annualCapCents,
      allowPartialCharge: data.allowPartialCharge,
      status: "pending",
      inviteId,
      donorGroupId,
      originalInviteToken: data.inviteToken,
      signupSource: data.groupSlug ?? (data.inviteToken ? "private_invite" : "public"),
    },
  });

  return NextResponse.json({
    donorId: donor.id,
    clientSecret: setupIntent.client_secret,
  });
}
