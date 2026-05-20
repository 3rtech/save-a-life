import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="font-bold text-slate-900">Save a Life</div>
          <div className="text-xs text-slate-500 mt-0.5">Admin Portal</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/donors", label: "Donors" },
            { href: "/admin/invites", label: "Invites" },
            { href: "/admin/campaigns", label: "Campaigns" },
            { href: "/admin/charges", label: "Charges" },
            { href: "/admin/reports", label: "Reports" },
            { href: "/admin/audit-logs", label: "Audit Logs" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 mb-2 truncate">{session.user.email}</div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-auto">
        {!process.env.STRIPE_SECRET_KEY && (
          <div className="bg-amber-400 text-amber-950 text-xs font-semibold text-center py-2 px-4 shrink-0">
            🧪 DEMO MODE — Charges are simulated. No real payments will be processed.
          </div>
        )}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
