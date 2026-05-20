import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">Thank you.</h1>

        <p className="text-lg text-slate-600 mb-8">
          You are now part of the Save a Life emergency donor circle. When a crisis happens, your
          pledge can help move someone to safety quickly.
        </p>

        <p className="text-sm text-slate-500 mb-6">
          You will receive a confirmation email shortly. You can pause or cancel your authorization
          at any time by contacting us.
        </p>

        <Link
          href="/"
          className="inline-block text-sm text-blue-700 hover:underline"
        >
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
