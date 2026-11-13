import { notFound } from "next/navigation";
import Link from "next/link";
import { getBean } from "@/lib/api/beans";
import { getSupplier } from "@/lib/api/suppliers";
import { StatusChip } from "@/components/ui/StatusChip";
import { FlavorBar } from "@/components/ui/FlavorBar";
import { formatPrice, ROAST_LEVELS, UNITS } from "@/product.config";
import { ApiError } from "@/lib/api/client";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

const roastLabel = (val: string) =>
  ROAST_LEVELS.find((r) => r.value === val)?.label ?? val;

export default async function OwnerBeanDetailPage({ params }: Props) {
  const { id } = await params;

  let bean;
  try {
    bean = await getBean(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  let supplier = null;
  try {
    supplier = await getSupplier(bean.supplier_id);
  } catch {
    // Supplier lookup failing is not fatal for the page
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard/owner/beans"
          className="text-sm text-text-3 hover:text-text"
        >
          ← Back to catalog
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">{bean.name}</h1>
            <p className="mt-1 text-sm text-text-3">
              {bean.origin}
              {bean.region ? `, ${bean.region}` : ""}
              {bean.farm ? ` · ${bean.farm}` : ""}
            </p>
          </div>
          <StatusChip status={bean.status} />
        </div>

        {/* Meta grid */}
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          {[
            { label: "Roast", value: roastLabel(bean.roast_level) },
            { label: "Process", value: bean.processing_method ?? "—" },
            { label: "Varietal", value: bean.varietal ?? "—" },
            { label: "Altitude", value: bean.altitude_m ? `${bean.altitude_m} m` : "—" },
            { label: "Producer", value: bean.producer ?? "—" },
            { label: "Stock", value: `${bean.stock_kg.toFixed(1)} ${UNITS.weight}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-text-3">{label}</dt>
              <dd className="mt-0.5 font-medium text-text">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Price */}
        <div className="mt-6 rounded-lg bg-surface-2 px-4 py-3">
          <p className="text-xs text-text-3">Price per kg</p>
          <p className="mt-0.5 text-xl font-semibold text-text">
            {formatPrice(bean.price_per_kg)}
          </p>
        </div>

        {/* Flavor notes */}
        {bean.flavor_notes.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-3">
              Flavor notes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {bean.flavor_notes.map((note) => (
                <span
                  key={note}
                  className="rounded-full bg-surface-2 px-3 py-1 text-sm text-text-2"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Flavor profile */}
        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-3">
            Flavor profile
          </p>
          <div className="flex flex-col gap-2">
            <FlavorBar label="Acidity" value={bean.acidity} />
            <FlavorBar label="Body" value={bean.body} />
            <FlavorBar label="Sweetness" value={bean.sweetness} />
          </div>
        </div>

        {/* Producer story */}
        {bean.producer_story && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-3">
              Producer story
            </p>
            <p className="text-sm leading-relaxed text-text-2">{bean.producer_story}</p>
          </div>
        )}
      </div>

      {/* Supplier card */}
      {supplier && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-3">
            Supplier
          </p>
          <Link
            href={`/dashboard/owner/suppliers/${supplier.id}`}
            className="font-medium text-text hover:text-brand-600"
          >
            {supplier.business_name}
          </Link>
          {supplier.location && (
            <p className="mt-0.5 text-sm text-text-3">{supplier.location}</p>
          )}
        </div>
      )}
    </div>
  );
}
