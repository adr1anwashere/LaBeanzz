import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import type { AppSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "LaBeans — Owner" };
export const instant = false;

const NAV = [
  { href: "/dashboard/owner", label: "Dashboard", icon: "⬛" },
  { href: "/dashboard/owner/blends", label: "My Blends", icon: "☕" },
  { href: "/dashboard/owner/beans", label: "Browse Beans", icon: "🌱" },
  { href: "/dashboard/owner/suppliers", label: "Suppliers", icon: "🏢" },
  { href: "/dashboard/owner/orders", label: "Orders", icon: "📦" },
];

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await auth()) as AppSession | null;
  if (!session || session.user?.role !== "OWNER") redirect("/login");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-14 items-center px-5">
          <span className="text-base font-semibold tracking-tight text-brand-700">
            LaBeans
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="Owner navigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-3">
          <p className="truncate text-xs text-text-3">{session.user?.email}</p>
          <Link
            href="/api/auth/signout"
            className="mt-1 text-xs text-text-3 hover:text-text"
          >
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <span className="text-base font-semibold tracking-tight text-brand-700">
            LaBeans
          </span>
        </header>

        <main className="flex-1 overflow-y-auto bg-surface-2 p-6">{children}</main>
      </div>
    </div>
  );
}
