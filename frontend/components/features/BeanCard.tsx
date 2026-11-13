import Link from "next/link";
import type { CoffeeBean } from "@/lib/api/beans";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatPrice, ROAST_LEVELS, UNITS } from "@/product.config";

interface BeanCardProps {
  bean: CoffeeBean;
  href: string;
}

const roastLabel = (val: string) =>
  ROAST_LEVELS.find((r) => r.value === val)?.label ?? val;

export function BeanCard({ bean, href }: BeanCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-text group-hover:text-brand-600">
            {bean.name}
          </p>
          <p className="mt-0.5 text-sm text-text-3">
            {bean.origin}
            {bean.region ? `, ${bean.region}` : ""}
          </p>
        </div>
        <StatusChip status={bean.status} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {bean.flavor_notes.slice(0, 4).map((note) => (
          <span
            key={note}
            className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-text-2"
          >
            {note}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-2 text-sm">
        <span className="text-text-3">
          {roastLabel(bean.roast_level)}
          {bean.processing_method ? ` · ${bean.processing_method}` : ""}
        </span>
        <span className="font-medium text-text">
          {formatPrice(bean.price_per_kg)}/{UNITS.weight}
        </span>
      </div>
    </Link>
  );
}
