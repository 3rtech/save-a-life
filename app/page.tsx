import Link from "next/link";

function Logo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 28C16 28 4 20.5 4 11.5C4 8.42 6.42 6 9.5 6C11.24 6 12.91 6.81 14 8.09C15.09 6.81 16.76 6 18.5 6C21.58 6 24 8.42 24 11.5C24 20.5 16 28 16 28Z"
        fill="currentColor"
      />
      <path
        d="M16 10C16.85 8.08 18.7 6.8 20.8 6.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

const steps = [
  {
    n: "1",
    title: "Set your pledge",
    body: "Choose how much you want to give per emergency and set a monthly maximum — you're always in control.",
  },
  {
    n: "2",
    title: "Save your card securely",
    body: "Your payment info is stored by Stripe, never us. We only keep authorization to charge within your limits.",
  },
  {
    n: "3",
    title: "We act when lives need it",
    body: "When a verified crisis arises, our team initiates a charge — instantly, within your approved amount.",
  },
  {
    n: "4",
    title: "You receive a notification",
    body: "We notify you by email or text every time your gift is used, with details about the emergency it served.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#FFFBF7" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-orange-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#991B1B" }}>
            <Logo className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-stone-900 tracking-tight">Save a Life</span>
            <span className="hidden sm:inline text-stone-400 text-sm ml-2">· Rescue a Soul</span>
          </div>
        </div>
        <Link
          href="/login"
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          Admin ›
        </Link>
      </nav>

      {/* Hero */}
      <section
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24"
        style={{
          background: "linear-gradient(160deg, #FFFBF7 0%, #FEF2F2 50%, #FFF7ED 100%)",
        }}
      >
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 border"
          style={{ background: "#FEF2F2", color: "#991B1B", borderColor: "#FECACA" }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#991B1B" }} />
          Emergency Donor Circle — Now Accepting Members
        </div>

        <h1
          className="text-5xl sm:text-6xl font-bold leading-tight mb-6 max-w-3xl"
          style={{ fontFamily: "var(--font-lora, serif)", color: "#1C1917" }}
        >
          Be there when a life<br />
          <span style={{ color: "#991B1B" }}>hangs in the balance.</span>
        </h1>

        <p className="text-lg text-stone-600 max-w-xl mb-10 leading-relaxed">
          Join a trusted donor circle for emergency crisis intervention. Pre-authorize a gift
          within your chosen limits — we only charge when a verified life-or-death situation demands it.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/join"
            className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "#991B1B" }}
          >
            <Logo className="w-5 h-5 text-white opacity-80" />
            Join the Donor Circle
          </Link>
          <span className="text-sm text-stone-400">No charge until a real emergency occurs.</span>
        </div>

        <div className="flex items-center gap-6 mt-12 text-sm text-stone-500">
          {["Stripe-secured payments", "Cancel anytime", "You set your own limits"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <svg className="w-4 h-4" style={{ color: "#991B1B" }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-white border-t border-orange-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#991B1B" }}>
            How It Works
          </p>
          <h2
            className="text-3xl font-bold text-center mb-12 text-stone-900"
            style={{ fontFamily: "var(--font-lora, serif)" }}
          >
            Simple. Automatic. Controlled by you.
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {steps.map(({ n, title, body }) => (
              <div
                key={n}
                className="rounded-2xl p-6 border"
                style={{ background: "#FFFBF7", borderColor: "#FED7AA" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white mb-4"
                  style={{ background: "#991B1B" }}
                >
                  {n}
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-orange-100 px-6 py-10" style={{ background: "#FFFBF7" }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-stone-500 text-sm leading-relaxed">
            Your card is never stored by us — only by Stripe, which is PCI-compliant and used by
            millions of businesses worldwide. You can pause or cancel your authorization at any time
            by contacting us. Donations may not be tax-deductible; consult your tax advisor.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orange-100 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#991B1B" }}
            >
              <Logo className="w-3 h-3 text-white" />
            </div>
            <span>Save a Life / Rescue a Soul</span>
          </div>
          <span>Emergency Donor Platform</span>
        </div>
      </footer>
    </div>
  );
}
