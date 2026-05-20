import { db } from "@/lib/db";
import DonorSignupForm from "@/components/DonorSignupForm";
import { notFound } from "next/navigation";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await db.donorInvite.findUnique({ where: { inviteToken: token } });

  if (!invite || invite.status !== "active") notFound();
  if (invite.expiresAt && invite.expiresAt < new Date()) notFound();

  return (
    <DonorSignupForm
      inviteToken={token}
      signupSource="private_invite"
      prefill={{
        firstName: invite.invitedFirstName ?? "",
        lastName: invite.invitedLastName ?? "",
        email: invite.invitedEmail ?? "",
        phone: invite.invitedPhone ?? "",
        perEmergencyAmount: invite.suggestedPerEmergencyAmountCents
          ? (invite.suggestedPerEmergencyAmountCents / 100).toString()
          : "",
        monthlyCap: invite.suggestedMonthlyCapCents
          ? (invite.suggestedMonthlyCapCents / 100).toString()
          : "",
      }}
    />
  );
}
