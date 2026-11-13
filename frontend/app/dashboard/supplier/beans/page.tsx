"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSupplierBeans, deleteBean, type CoffeeBean } from "@/lib/api/beans";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatPrice, UNITS } from "@/product.config";

export default function SupplierBeansPage() {
  const [beans, setBeans] = useState<CoffeeBean[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchBeans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSupplierBeans({ per_page: 100 });
      setBeans(data.items);
      setTotal(data.total);
    } catch {
      setError("Could not load your beans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBeans();
  }, [fetchBeans]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteBean(id);
      setBeans((prev) => prev.filter((b) => b.id !== id));
      setTotal((t) => t - 1);
    } catch {
      alert("Could not delete bean. Try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">My Beans</h1>
          <p className="mt-1 text-sm text-text-3">
            {total} bean{total === 1 ? "" : "s"} listed
          </p>
        </div>
        <Link
          href="/dashboard/supplier/beans/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          + Add bean
        </Link>
      </div>

      {loading && (
        <div className="py-16 text-center text-sm text-text-3">Loading…</div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {!loading && !error && beans.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-text-3">You haven't listed any beans yet.</p>
          <Link
            href="/dashboard/supplier/beans/new"
            className="mt-4 inline-block text-sm text-brand-600 hover:underline"
          >
            Add your first bean →
          </Link>
        </div>
      )}

      {!loading && !error && beans.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-xs font-medium uppercase tracking-wide text-text-3">
                <th className="px-4 py-3">Bean</th>
                <th className="px-4 py-3 hidden sm:table-cell">Origin</th>
                <th className="px-4 py-3 hidden md:table-cell">Roast</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden sm:table-cell text-right">Stock (kg)</th>
                <th className="px-4 py-3 text-right">Price/kg</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {beans.map((bean) => (
                <tr key={bean.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3 font-medium text-text">{bean.name}</td>
                  <td className="px-4 py-3 text-text-3 hidden sm:table-cell">{bean.origin}</td>
                  <td className="px-4 py-3 text-text-3 hidden md:table-cell capitalize">
                    {bean.roast_level.replace("_", "-").toLowerCase()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={bean.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-2 hidden sm:table-cell">
                    {bean.stock_kg.toFixed(1)} {UNITS.weight}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-text">
                    {formatPrice(bean.price_per_kg)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/supplier/beans/${bean.id}`}
                        className="rounded px-2 py-1 text-xs text-brand-600 hover:bg-surface-2"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(bean.id, bean.name)}
                        disabled={deleting === bean.id}
                        className="rounded px-2 py-1 text-xs text-danger hover:bg-danger/5 disabled:opacity-40"
                      >
                        {deleting === bean.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
