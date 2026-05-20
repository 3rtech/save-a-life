import { describe, it, expect } from "vitest";
import { calculateDonorChargeAmount } from "./charge-calculator";

describe("calculateDonorChargeAmount", () => {
  it("charges full amount when within all caps", () => {
    const result = calculateDonorChargeAmount({
      perEmergencyAmountCents: 10000,
      monthlyCapCents: 30000,
      annualCapCents: null,
      monthToDateChargedCents: 0,
      yearToDateChargedCents: 0,
      allowPartialCharge: false,
    });
    expect(result).toEqual({ shouldCharge: true, amountCents: 10000, reason: "full_amount" });
  });

  it("returns monthly_cap_reached when monthly cap is exhausted", () => {
    const result = calculateDonorChargeAmount({
      perEmergencyAmountCents: 10000,
      monthlyCapCents: 30000,
      annualCapCents: null,
      monthToDateChargedCents: 30000,
      yearToDateChargedCents: 30000,
      allowPartialCharge: false,
    });
    expect(result).toEqual({ shouldCharge: false, amountCents: 0, reason: "monthly_cap_reached" });
  });

  it("returns annual_cap_reached when annual cap is exhausted", () => {
    const result = calculateDonorChargeAmount({
      perEmergencyAmountCents: 10000,
      monthlyCapCents: 30000,
      annualCapCents: 50000,
      monthToDateChargedCents: 0,
      yearToDateChargedCents: 50000,
      allowPartialCharge: true,
    });
    expect(result).toEqual({ shouldCharge: false, amountCents: 0, reason: "annual_cap_reached" });
  });

  it("charges partial when partial allowed and monthly remaining < per_emergency", () => {
    const result = calculateDonorChargeAmount({
      perEmergencyAmountCents: 10000,
      monthlyCapCents: 30000,
      annualCapCents: null,
      monthToDateChargedCents: 25000,
      yearToDateChargedCents: 25000,
      allowPartialCharge: true,
    });
    expect(result).toEqual({ shouldCharge: true, amountCents: 5000, reason: "partial_amount" });
  });

  it("skips when partial not allowed and full amount does not fit", () => {
    const result = calculateDonorChargeAmount({
      perEmergencyAmountCents: 10000,
      monthlyCapCents: 30000,
      annualCapCents: null,
      monthToDateChargedCents: 25000,
      yearToDateChargedCents: 25000,
      allowPartialCharge: false,
    });
    expect(result).toEqual({
      shouldCharge: false,
      amountCents: 0,
      reason: "insufficient_remaining_capacity",
    });
  });

  it("respects the spec example: $100 per emergency, $300 monthly, $250 charged, partial allowed", () => {
    const result = calculateDonorChargeAmount({
      perEmergencyAmountCents: 10000,
      monthlyCapCents: 30000,
      annualCapCents: null,
      monthToDateChargedCents: 25000,
      yearToDateChargedCents: 25000,
      allowPartialCharge: true,
    });
    expect(result.shouldCharge).toBe(true);
    expect(result.amountCents).toBe(5000);
    expect(result.reason).toBe("partial_amount");
  });

  it("uses annual cap when it is tighter than monthly cap", () => {
    const result = calculateDonorChargeAmount({
      perEmergencyAmountCents: 10000,
      monthlyCapCents: 30000,
      annualCapCents: 12000,
      monthToDateChargedCents: 0,
      yearToDateChargedCents: 9000,
      allowPartialCharge: true,
    });
    expect(result).toEqual({ shouldCharge: true, amountCents: 3000, reason: "partial_amount" });
  });

  it("charges full when no annual cap set", () => {
    const result = calculateDonorChargeAmount({
      perEmergencyAmountCents: 5000,
      monthlyCapCents: 20000,
      annualCapCents: undefined,
      monthToDateChargedCents: 10000,
      yearToDateChargedCents: 60000,
      allowPartialCharge: false,
    });
    expect(result).toEqual({ shouldCharge: true, amountCents: 5000, reason: "full_amount" });
  });
});
