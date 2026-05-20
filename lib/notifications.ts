import twilio from "twilio";
import { Resend } from "resend";
import { db } from "./db";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function sendChargeSuccessSMS(params: {
  phone: string;
  amountCents: number;
  donorId: string;
  campaignId: string;
  chargeId: string;
}) {
  const body = `Save a Life: Your card was charged ${formatDollars(params.amountCents)} for an emergency crisis intervention, within your approved donor limits. Thank you for helping rescue a soul.`;

  const notif = await db.donorNotification.create({
    data: {
      donorId: params.donorId,
      campaignId: params.campaignId,
      chargeId: params.chargeId,
      notificationType: "charge_success",
      channel: "sms",
      status: "pending",
      messageBody: body,
    },
  });

  if (!twilioClient) return;

  try {
    const msg = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER!,
      to: params.phone,
    });
    await db.donorNotification.update({
      where: { id: notif.id },
      data: { status: "sent", providerMessageId: msg.sid, sentAt: new Date() },
    });
  } catch {
    await db.donorNotification.update({
      where: { id: notif.id },
      data: { status: "failed" },
    });
  }
}

export async function sendChargeFailedSMS(params: {
  phone: string;
  amountCents: number;
  donorId: string;
  campaignId: string;
  chargeId: string;
  updatePaymentUrl: string;
}) {
  const body = `Save a Life: We attempted to process your emergency pledge of ${formatDollars(params.amountCents)}, but the payment did not go through. Please update your card here: ${params.updatePaymentUrl}`;

  const notif = await db.donorNotification.create({
    data: {
      donorId: params.donorId,
      campaignId: params.campaignId,
      chargeId: params.chargeId,
      notificationType: "charge_failed",
      channel: "sms",
      status: "pending",
      messageBody: body,
    },
  });

  if (!twilioClient) return;

  try {
    const msg = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER!,
      to: params.phone,
    });
    await db.donorNotification.update({
      where: { id: notif.id },
      data: { status: "sent", providerMessageId: msg.sid, sentAt: new Date() },
    });
  } catch {
    await db.donorNotification.update({
      where: { id: notif.id },
      data: { status: "failed" },
    });
  }
}

export async function sendChargeSuccessEmail(params: {
  email: string;
  firstName: string;
  amountCents: number;
  campaignTitle: string;
  donorId: string;
  campaignId: string;
  chargeId: string;
}) {
  const amount = formatDollars(params.amountCents);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const notif = await db.donorNotification.create({
    data: {
      donorId: params.donorId,
      campaignId: params.campaignId,
      chargeId: params.chargeId,
      notificationType: "charge_success",
      channel: "email",
      status: "pending",
    },
  });

  if (!resend) return;

  try {
    const { data } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: params.email,
      subject: "Your emergency donation was processed",
      html: `
        <p>Dear ${params.firstName},</p>
        <p>Thank you. Your card was charged <strong>${amount}</strong> for an emergency crisis intervention through Save a Life / Rescue a Soul.</p>
        <p>Your support helps us act quickly when someone is in immediate danger and needs treatment, transport, or urgent care.</p>
        <ul>
          <li><strong>Donation amount:</strong> ${amount}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Campaign:</strong> ${params.campaignTitle}</li>
        </ul>
        <p>Thank you for being part of this life-saving circle.</p>
      `,
    });
    await db.donorNotification.update({
      where: { id: notif.id },
      data: { status: "sent", providerMessageId: data?.id, sentAt: new Date() },
    });
  } catch {
    await db.donorNotification.update({
      where: { id: notif.id },
      data: { status: "failed" },
    });
  }
}
