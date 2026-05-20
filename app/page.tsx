import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold text-slate-900">Save a Life</span>
          <span className="ml-2 text-sm text-slate-500">Rescue a Soul</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-2"
        >
          Admin Login
        </Link>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
            Be there when a life is on the line.
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
            Join a trusted emergency donor circle. You choose your amount and your monthly limit.
            When a verified crisis requires immediate action, your pre-authorized gift helps move
            someone to safety without delay.
          </p>
          <Link
            href="/join"
            className="inline-block bg-blue-800 hover:bg-blue-900 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Join the Emergency Donor Circle
          </Link>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { step: "1", text: "Choose your emergency pledge amount." },
              { step: "2", text: "Set your monthly giving limit." },
              { step: "3", text: "Securely save your card through Stripe." },
              {
                step: "4",
                text: "When a verified emergency happens, your gift is processed automatically within your limits.",
              },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-800 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {step}
                </div>
                <p className="text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12 border-t border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            Your card is never stored by us. It is securely handled by Stripe. You can pause or
            cancel future authorization at any time.
          </p>
        </div>
      </section>
    </main>
  );
}
