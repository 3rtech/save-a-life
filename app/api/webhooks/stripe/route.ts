import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Missing signature or config" }, { status: 400 });
  }

  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await db.charge.updateMany({
        where: { stripePaymentIntentId: pi.id },
        data: {
          status: "succeeded",
          chargedAmountCents: pi.amount_received,
          chargedAt: new Date(),
        },
      });
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await db.charge.updateMany({
        where: { stripePaymentIntentId: pi.id },
        data: {
          status: "failed",
          failureReason: pi.last_payment_error?.message ?? "Payment failed",
        },
      });
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await db.charge.updateMany({
        where: { stripeChargeId: charge.id },
        data: { status: "refunded", refundedAt: new Date() },
      });
      break;
    }
    case "setup_intent.succeeded": {
      const si = event.data.object as Stripe.SetupIntent;
      if (si.customer && si.payment_method) {
        await db.donor.updateMany({
          where: { stripeCustomerId: si.customer as string },
          data: {
            stripePaymentMethodId: si.payment_method as string,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
