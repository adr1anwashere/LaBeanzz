"use client";

import { useState, useEffect, useCallback } from "react";
import { BeanCard } from "@/components/features/BeanCard";
import { getBeans, type CoffeeBean, type BeanFilters } from "@/lib/api/beans";
import { ROAST_LEVELS, BEAN_STATUS } from "@/product.config";

export default function OwnerBeansPage() {
  const [beans, setBeans] = useState<CoffeeBean[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [origin, setOrigin] = useState("");
  const [roast, setRoast] = useState("");
  const [status, setStatus] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchBeans = useCallback(
    async (filters: BeanFilters) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBeans(filters);
        setBeans(data.items);
        setTotal(data.total);
        setPages(data.pages);
      } catch {
        setError("Could not load beans. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchBeans({
      origin: origin || undefined,
      roast_level: (roast || undefined) as BeanFilters["roast_level"],
      status: (status || undefined) as BeanFilters["status"],
      max_price: maxPrice ? Number(maxPrice) : undefined,
      page,
    });
  }, [fetchBeans, origin, roast, status, maxPrice, page]);

  function handleFilterChange() {
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Browse Beans</h1>
        <p className="mt-1 text-sm text-text-3">
          {total > 0 ? `${total} bean${total === 1 ? "" : "s"} available` : "Explore the catalog"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Origin country"
          value={origin}
          onChange={(e) => { setOrigin(e.target.value); handleFilterChange(); }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand-500 w-40"
          aria-label="Filter by origin"
        />

        <select
          value={roast}
          onChange={(e) => { setRoast(e.target.value); handleFilterChange(); }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Filter by roast level"
        >
          <option value="">All roasts</option>
          {ROAST_LEVELS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); handleFilterChange(); }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Filter by availability"
        >
          <option value="">All availability</option>
          {Object.entries(BEAN_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Max price/kg"
          value={maxPrice}
          min={0}
          onChange={(e) => { setMaxPrice(e.target.value); handleFilterChange(); }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand-500 w-32"
          aria-label="Maximum price per kg"
        />

        {(origin || roast || status || maxPrice) && (
          <button
            onClick={() => {
              setOrigin("");
              setRoast("");
              setStatus("");
              setMaxPrice("");
              setPage(1);
            }}
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-3 hover:text-text"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
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
          <p className="text-text-3">No beans match your filters.</p>
        </div>
      )}

      {!loading && !error && beans.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beans.map((bean) => (
            <BeanCard
              key={bean.id}
              bean={bean}
              href={`/dashboard/owner/beans/${bean.id}`}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-text-3">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
