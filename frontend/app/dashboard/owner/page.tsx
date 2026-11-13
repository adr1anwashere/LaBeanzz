import { auth } from "@/auth";
import Link from "next/link";
import { getBeans } from "@/lib/api/beans";

export const instant = false;

export default async function OwnerDashboardPage() {
  const session = await auth();

  // Best-effort: show available bean count. Silently fail if backend is down.
  let availableBeans = 0;
  try {
    const data = await getBeans({ status: "AVAILABLE", per_page: 1 });
    availableBeans = data.total;
  } catch {
    // keep 0
  }

  const stats = [
    { label: "Active blends", value: "—", href: "/dashboard/owner/blends" },
    { label: "Open orders", value: "—", href: "/dashboard/owner/orders" },
    {
      label: "Beans available",
      value: availableBeans > 0 ? String(availableBeans) : "—",
      href: "/dashboard/owner/beans",
    },
  ];

  const quickLinks = [
    {
      title: "Browse beans",
      description: "Explore the catalog from all suppliers.",
      href: "/dashboard/owner/beans",
      icon: "🌱",
    },
    {
      title: "New blend",
      description: "Describe a flavor and get an AI recipe.",
      href: "/dashboard/owner/blends/new",
      icon: "✨",
    },
    {
      title: "My blends",
      description: "View and manage your saved recipes.",
      href: "/dashboard/owner/blends",
      icon: "☕",
    },
    {
      title: "Suppliers",
      description: "Browse the supplier directory.",
      href: "/dashboard/owner/suppliers",
      icon: "🏢",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-text">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-text-3">
          Here's what's happening with your coffee operation.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-text-3">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-text">{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
            >
              <span className="text-xl" aria-hidden="true">
                {link.icon}
              </span>
              <div>
                <p className="font-medium text-text">{link.title}</p>
                <p className="mt-0.5 text-sm text-text-3">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
