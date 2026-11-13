import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupplier } from "@/lib/api/suppliers";
import { getBeans } from "@/lib/api/beans";
import { BeanCard } from "@/components/features/BeanCard";
import { ApiError } from "@/lib/api/client";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OwnerSupplierDetailPage({ params }: Props) {
  const { id } = await params;

  let supplier;
  try {
    supplier = await getSupplier(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  let beansResult = { items: [] as Awaited<ReturnType<typeof getBeans>>["items"] };
  try {
    beansResult = await getBeans({ supplier_id: id, per_page: 50 });
  } catch {
    // Non-fatal
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link
          href="/dashboard/owner/suppliers"
          className="text-sm text-text-3 hover:text-text"
        >
          ← Back to suppliers
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-semibold text-text">
          {supplier.business_name}
        </h1>
        {supplier.location && (
          <p className="mt-1 text-sm text-text-3">{supplier.location}</p>
        )}
        {supplier.description && (
          <p className="mt-4 text-sm leading-relaxed text-text-2">
            {supplier.description}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-text">
          Beans from this supplier ({beansResult.items.length})
        </h2>

        {beansResult.items.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-text-3">No beans listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {beansResult.items.map((bean) => (
              <BeanCard
                key={bean.id}
                bean={bean}
                href={`/dashboard/owner/beans/${bean.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
