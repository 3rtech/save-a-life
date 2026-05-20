import DonorSignupForm from "@/components/DonorSignupForm";

export default function JoinPage() {
  return (
    <DonorSignupForm
      signupSource="public"
      prefill={{}}
    />
  );
}
