export type DonorChargeInput = {
  perEmergencyAmountCents: number;
  monthlyCapCents: number;
  annualCapCents?: number | null;
  monthToDateChargedCents: number;
  yearToDateChargedCents: number;
  allowPartialCharge: boolean;
};

export type DonorChargeDecision = {
  shouldCharge: boolean;
  amountCents: number;
  reason:
    | "full_amount"
    | "partial_amount"
    | "monthly_cap_reached"
    | "annual_cap_reached"
    | "insufficient_remaining_capacity";
};

export function calculateDonorChargeAmount(input: DonorChargeInput): DonorChargeDecision {
  const {
    perEmergencyAmountCents,
    monthlyCapCents,
    annualCapCents,
    monthToDateChargedCents,
    yearToDateChargedCents,
    allowPartialCharge,
  } = input;

  const monthlyRemaining = monthlyCapCents - monthToDateChargedCents;

  if (monthlyRemaining <= 0) {
    return { shouldCharge: false, amountCents: 0, reason: "monthly_cap_reached" };
  }

  const annualRemaining =
    annualCapCents != null ? annualCapCents - yearToDateChargedCents : Infinity;

  if (annualRemaining <= 0) {
    return { shouldCharge: false, amountCents: 0, reason: "annual_cap_reached" };
  }

  const maxAllowed = Math.min(monthlyRemaining, annualRemaining);

  if (perEmergencyAmountCents <= maxAllowed) {
    return { shouldCharge: true, amountCents: perEmergencyAmountCents, reason: "full_amount" };
  }

  if (!allowPartialCharge) {
    return {
      shouldCharge: false,
      amountCents: 0,
      reason: "insufficient_remaining_capacity",
    };
  }

  if (maxAllowed > 0) {
    return { shouldCharge: true, amountCents: maxAllowed, reason: "partial_amount" };
  }

  return { shouldCharge: false, amountCents: 0, reason: "insufficient_remaining_capacity" };
}
