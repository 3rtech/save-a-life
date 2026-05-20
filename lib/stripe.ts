import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string];
  },
});

export async function createCustomer(params: {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}) {
  return getStripe().customers.create({
    email: params.email,
    name: params.name,
    phone: params.phone,
    metadata: params.metadata,
  });
}

export async function createSetupIntent(customerId: string) {
  return getStripe().setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
  });
}

export async function chargeOffSession(params: {
  customerId: string;
  paymentMethodId: string;
  amountCents: number;
  idempotencyKey: string;
  metadata: Record<string, string>;
}) {
  return getStripe().paymentIntents.create(
    {
      customer: params.customerId,
      payment_method: params.paymentMethodId,
      amount: params.amountCents,
      currency: "usd",
      off_session: true,
      confirm: true,
      metadata: {
        ...params.metadata,
        platform_name: "Save a Life",
      },
    },
    { idempotencyKey: params.idempotencyKey }
  );
}

export async function refundCharge(stripeChargeId: string, amountCents?: number) {
  return getStripe().refunds.create({
    charge: stripeChargeId,
    ...(amountCents ? { amount: amountCents } : {}),
  });
}
