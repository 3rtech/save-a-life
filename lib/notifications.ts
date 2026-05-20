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

async function sendSMS(to: string, body: string, meta: {
  donorId: string; campaignId: string; chargeId: string; type: string;
}) {
  const notif = await db.donorNotification.create({
    data: {
      donorId: meta.donorId,
      campaignId: meta.campaignId,
      chargeId: meta.chargeId,
      notificationType: meta.type,
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
      to,
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

async function sendEmail(params: {
  to: string; subject: string; html: string;
  meta: { donorId: string; campaignId: string; chargeId: string; type: string };
}) {
  const notif = await db.donorNotification.create({
    data: {
      donorId: params.meta.donorId,
      campaignId: params.meta.campaignId,
      chargeId: params.meta.chargeId,
      notificationType: params.meta.type,
      channel: "email",
      status: "pending",
    },
  });

  if (!resend) return;

  try {
    const { data } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: params.to,
      subject: params.subject,
      html: params.html,
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

export async function sendChargeSuccessNotifications(params: {
  donor: {
    id: string;
    email: string;
    firstName: string;
    phone: string | null;
    notificationPreference: string;
  };
  amountCents: number;
  campaignId: string;
  chargeId: string;
  campaignTitle: string;
  caseDescription: string | null;
}) {
  const { donor, amountCents, campaignId, chargeId, campaignTitle, caseDescription } = params;
  const amount = formatDollars(amountCents);
  const meta = { donorId: donor.id, campaignId, chargeId, type: "charge_success" };
  const descriptionLine = caseDescription ? ` "${caseDescription}"` : "";
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const wantsSMS = (donor.notificationPreference === "sms" || donor.notificationPreference === "both") && donor.phone;
  const wantsEmail = donor.notificationPreference === "email" || donor.notificationPreference === "both";

  if (wantsSMS) {
    const body = `Save a Life: Your card was charged ${amount} for an emergency.${descriptionLine} Thank you for helping rescue a soul.`;
    await sendSMS(donor.phone!, body, meta);
  }

  if (wantsEmail) {
    const html = `
      <p>Dear ${donor.firstName},</p>
      <p>Thank you. Your card was charged <strong>${amount}</strong> for an emergency crisis intervention through Save a Life / Rescue a Soul.</p>
      ${caseDescription ? `<p><em>${caseDescription}</em></p>` : ""}
      <p>Your support helps us act quickly when someone is in immediate danger and needs treatment, transport, or urgent care.</p>
      <ul>
        <li><strong>Donation amount:</strong> ${amount}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Campaign:</strong> ${campaignTitle}</li>
      </ul>
      <p>Thank you for being part of this life-saving circle.</p>
    `;
    await sendEmail({ to: donor.email, subject: "Your emergency donation was processed", html, meta });
  }

  // Fallback: always email if no preference matched (e.g. SMS requested but no phone)
  if (!wantsSMS && !wantsEmail) {
    const html = `<p>Dear ${donor.firstName},</p><p>Your card was charged <strong>${amount}</strong> for an emergency. Thank you for your support.</p>`;
    await sendEmail({ to: donor.email, subject: "Your emergency donation was processed", html, meta });
  }
}

export async function sendChargeFailedNotifications(params: {
  donor: {
    id: string;
    email: string;
    firstName: string;
    phone: string | null;
    notificationPreference: string;
  };
  amountCents: number;
  campaignId: string;
  chargeId: string;
  updatePaymentUrl: string;
}) {
  const { donor, amountCents, campaignId, chargeId, updatePaymentUrl } = params;
  const amount = formatDollars(amountCents);
  const meta = { donorId: donor.id, campaignId, chargeId, type: "charge_failed" };

  const wantsSMS = (donor.notificationPreference === "sms" || donor.notificationPreference === "both") && donor.phone;
  const wantsEmail = donor.notificationPreference === "email" || donor.notificationPreference === "both";

  if (wantsSMS) {
    const body = `Save a Life: We attempted to process your emergency pledge of ${amount}, but the payment did not go through. Please update your card: ${updatePaymentUrl}`;
    await sendSMS(donor.phone!, body, meta);
  }

  if (wantsEmail || (!wantsSMS)) {
    const html = `
      <p>Dear ${donor.firstName},</p>
      <p>We attempted to process your emergency pledge of <strong>${amount}</strong>, but the payment did not go through.</p>
      <p>Please <a href="${updatePaymentUrl}">update your payment method</a> to stay active in the donor circle.</p>
    `;
    await sendEmail({ to: donor.email, subject: "Action needed: your emergency pledge could not be processed", html, meta });
  }
}
