import { getSuppliers } from "@/lib/api/suppliers";
import Link from "next/link";

export const instant = false;

export default async function OwnerSuppliersPage() {
  let result;
  try {
    result = await getSuppliers();
  } catch {
    result = { items: [] };
  }

  const suppliers = result.items;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Suppliers</h1>
        <p className="mt-1 text-sm text-text-3">
          {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"} on the platform
        </p>
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-text-3">No suppliers yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/owner/suppliers/${s.id}`}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <p className="font-semibold text-text group-hover:text-brand-600">
                {s.business_name}
              </p>
              {s.location && (
                <p className="text-sm text-text-3">{s.location}</p>
              )}
              {s.description && (
                <p className="mt-1 line-clamp-2 text-sm text-text-2">
                  {s.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
