import { auth } from "@/auth";

export default async function OwnerDashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-text-3">
          Your blends and orders will appear here.
        </p>
      </div>

      {/* Placeholder stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Active blends", value: "—" },
          { label: "Open orders", value: "—" },
          { label: "Beans available", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-text-3">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-text">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
