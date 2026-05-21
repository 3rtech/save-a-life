import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "linear-gradient(160deg, #FFFBF7 0%, #FEF2F2 50%, #FFF7ED 100%)" }}
    >
      {/* Icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-8 shadow-lg"
        style={{ background: "#991B1B" }}
      >
        <svg className="w-10 h-10 text-white" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 28C16 28 4 20.5 4 11.5C4 8.42 6.42 6 9.5 6C11.24 6 12.91 6.81 14 8.09C15.09 6.81 16.76 6 18.5 6C21.58 6 24 8.42 24 11.5C24 20.5 16 28 16 28Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="max-w-lg text-center">
        <h1
          className="text-4xl font-bold text-stone-900 mb-5"
          style={{ fontFamily: "var(--font-lora, serif)" }}
        >
          You may have just saved a life.
        </h1>

        <p className="text-lg text-stone-600 leading-relaxed mb-4">
          You are now part of the <strong>Save a Life</strong> emergency donor circle. When a
          crisis strikes and someone needs immediate help, your pre-authorized pledge puts
          us in motion — without waiting.
        </p>

        <p className="text-sm text-stone-400 mb-10">
          You will receive a confirmation by email or text. You can pause or cancel your
          authorization at any time by reaching out to us.
        </p>

        <div
          className="rounded-2xl border p-5 mb-8 text-left"
          style={{ background: "#FEF2F2", borderColor: "#FECACA" }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "#991B1B" }}>What happens next?</p>
          <ul className="text-sm text-stone-600 space-y-1 list-disc list-inside">
            <li>Your card is securely stored by Stripe — we never see the number.</li>
            <li>We will only charge within the limits you set, per emergency.</li>
            <li>You will be notified by your chosen channel every time a charge occurs.</li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-block text-sm font-medium transition-colors"
          style={{ color: "#991B1B" }}
        >
          ← Return to homepage
        </Link>
      </div>
    </div>
  );
}
