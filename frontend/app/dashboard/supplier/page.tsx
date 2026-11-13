import { auth } from "@/auth";
import Link from "next/link";
import { getSupplierBeans } from "@/lib/api/beans";

export const instant = false;

export default async function SupplierDashboardPage() {
  const session = await auth();

  let totalBeans = 0;
  let lowStockBeans = 0;
  try {
    const data = await getSupplierBeans({ per_page: 100 });
    totalBeans = data.total;
    lowStockBeans = data.items.filter(
      (b) => b.status === "LOW_STOCK" || b.status === "OUT_OF_STOCK"
    ).length;
  } catch {
    // keep 0
  }

  const stats = [
    {
      label: "Listed beans",
      value: totalBeans > 0 ? String(totalBeans) : "—",
      href: "/dashboard/supplier/beans",
    },
    { label: "Pending orders", value: "—", href: "/dashboard/supplier/orders" },
    {
      label: "Low / out of stock",
      value: lowStockBeans > 0 ? String(lowStockBeans) : "—",
      href: "/dashboard/supplier/beans",
    },
  ];

  const quickLinks = [
    {
      title: "My beans",
      description: "Manage your bean listings and stock levels.",
      href: "/dashboard/supplier/beans",
      icon: "🌱",
    },
    {
      title: "Add a bean",
      description: "List a new origin or lot for owners to discover.",
      href: "/dashboard/supplier/beans/new",
      icon: "➕",
    },
    {
      title: "Orders",
      description: "View and fulfil incoming orders.",
      href: "/dashboard/supplier/orders",
      icon: "📦",
    },
    {
      title: "Your profile",
      description: "Update your company info and story.",
      href: "/dashboard/supplier/profile",
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
          Manage your beans and fulfil orders from here.
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
