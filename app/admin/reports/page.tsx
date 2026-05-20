import Link from "next/link";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Reports</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Charge Export</h2>
        <p className="text-sm text-slate-500 mb-4">
          Download all charges as a CSV file, sorted by most recent.
        </p>
        <Link
          href="/api/admin/reports/export"
          className="inline-block bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Download CSV
        </Link>
      </div>
    </div>
  );
}
