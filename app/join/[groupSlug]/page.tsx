import DonorSignupForm from "@/components/DonorSignupForm";

export default async function GroupJoinPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  return <DonorSignupForm signupSource={groupSlug} groupSlug={groupSlug} prefill={{}} />;
}
