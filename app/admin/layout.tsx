import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

function HeartLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16 28C16 28 4 20.5 4 11.5C4 8.42 6.42 6 9.5 6C11.24 6 12.91 6.81 14 8.09C15.09 6.81 16.76 6 18.5 6C21.58 6 24 8.42 24 11.5C24 20.5 16 28 16 28Z" />
    </svg>
  );
}

const navLinks = [
  { href: "/admin",            label: "Dashboard",   icon: "⊞" },
  { href: "/admin/donors",     label: "Donors",      icon: "♥" },
  { href: "/admin/invites",    label: "Invites",     icon: "✉" },
  { href: "/admin/campaigns",  label: "Campaigns",   icon: "⚡" },
  { href: "/admin/charges",    label: "Charges",     icon: "◈" },
  { href: "/admin/reports",    label: "Reports",     icon: "↓" },
  { href: "/admin/audit-logs", label: "Audit Logs",  icon: "≡" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex" style={{ background: "#FFFBF7" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex flex-col shrink-0 shadow-xl"
        style={{ background: "#7F1D1D" }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: "#991B1B" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#991B1B" }}
            >
              <HeartLogo className="w-4 h-4 text-red-200" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">Save a Life</div>
              <div className="text-red-300 text-xs leading-tight">Rescue a Soul</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-200 hover:bg-red-900/50 hover:text-white transition-colors group"
            >
              <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity w-4 text-center select-none">
                {icon}
              </span>
              {label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t" style={{ borderColor: "#991B1B" }}>
          <div className="text-xs text-red-300 mb-2 truncate">{session.user.email}</div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-red-400 hover:text-red-100 transition-colors"
            >
              Sign out →
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {!process.env.STRIPE_SECRET_KEY && (
          <div
            className="text-xs font-semibold text-center py-2 px-4 shrink-0"
            style={{ background: "#FEF3C7", color: "#92400E" }}
          >
            Demo Mode — Stripe not connected. Charges are simulated.
          </div>
        )}
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
