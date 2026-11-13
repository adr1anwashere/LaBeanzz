"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createBean,
  updateBean,
  type CoffeeBean,
  type CreateBeanPayload,
} from "@/lib/api/beans";
import { ROAST_LEVELS, BEAN_STATUS } from "@/product.config";

interface BeanFormProps {
  initial?: CoffeeBean;
}

export function BeanForm({ initial }: BeanFormProps) {
  const router = useRouter();
  const isEdit = !!initial;

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [fields, setFields] = useState({
    name: initial?.name ?? "",
    origin: initial?.origin ?? "",
    region: initial?.region ?? "",
    farm: initial?.farm ?? "",
    producer: initial?.producer ?? "",
    varietal: initial?.varietal ?? "",
    altitude_m: initial?.altitude_m?.toString() ?? "",
    processing_method: initial?.processing_method ?? "",
    roast_level: initial?.roast_level ?? "MEDIUM",
    flavor_notes: initial?.flavor_notes?.join(", ") ?? "",
    acidity: initial?.acidity?.toString() ?? "5",
    body: initial?.body?.toString() ?? "5",
    sweetness: initial?.sweetness?.toString() ?? "5",
    price_per_kg: initial?.price_per_kg?.toString() ?? "",
    stock_kg: initial?.stock_kg?.toString() ?? "0",
    status: initial?.status ?? "AVAILABLE",
    producer_story: initial?.producer_story ?? "",
  });

  function set(key: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);

    const payload: CreateBeanPayload = {
      name: fields.name.trim(),
      origin: fields.origin.trim(),
      region: fields.region.trim() || undefined,
      farm: fields.farm.trim() || undefined,
      producer: fields.producer.trim() || undefined,
      varietal: fields.varietal.trim() || undefined,
      altitude_m: fields.altitude_m ? parseInt(fields.altitude_m) : undefined,
      processing_method: fields.processing_method.trim() || undefined,
      roast_level: fields.roast_level as CreateBeanPayload["roast_level"],
      flavor_notes: fields.flavor_notes
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean),
      acidity: parseFloat(fields.acidity),
      body: parseFloat(fields.body),
      sweetness: parseFloat(fields.sweetness),
      price_per_kg: parseFloat(fields.price_per_kg),
      stock_kg: parseFloat(fields.stock_kg),
      status: fields.status as CreateBeanPayload["status"],
      producer_story: fields.producer_story.trim() || undefined,
    };

    try {
      if (isEdit && initial) {
        await updateBean(initial.id, payload);
      } else {
        await createBean(payload);
      }
      router.push("/dashboard/supplier/beans");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setServerError(msg);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
      {serverError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <Section title="Basic info">
        <Field label="Bean name *">
          <input required value={fields.name} onChange={(e) => set("name", e.target.value)} {...inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Origin country *">
            <input required value={fields.origin} onChange={(e) => set("origin", e.target.value)} {...inputClass} />
          </Field>
          <Field label="Region">
            <input value={fields.region} onChange={(e) => set("region", e.target.value)} {...inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Farm">
            <input value={fields.farm} onChange={(e) => set("farm", e.target.value)} {...inputClass} />
          </Field>
          <Field label="Producer">
            <input value={fields.producer} onChange={(e) => set("producer", e.target.value)} {...inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Varietal">
            <input value={fields.varietal} onChange={(e) => set("varietal", e.target.value)} {...inputClass} />
          </Field>
          <Field label="Altitude (m)">
            <input type="number" min={0} max={5000} value={fields.altitude_m} onChange={(e) => set("altitude_m", e.target.value)} {...inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Processing">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Processing method">
            <input value={fields.processing_method} onChange={(e) => set("processing_method", e.target.value)} {...inputClass} />
          </Field>
          <Field label="Roast level *">
            <select required value={fields.roast_level} onChange={(e) => set("roast_level", e.target.value)} {...selectClass}>
              {ROAST_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Flavor notes (comma-separated)">
          <input
            value={fields.flavor_notes}
            onChange={(e) => set("flavor_notes", e.target.value)}
            placeholder="e.g. dark chocolate, caramel, cedar"
            {...inputClass}
          />
        </Field>
      </Section>

      <Section title="Flavor profile (0 – 10)">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Acidity *">
            <input type="number" required min={0} max={10} step={0.1} value={fields.acidity} onChange={(e) => set("acidity", e.target.value)} {...inputClass} />
          </Field>
          <Field label="Body *">
            <input type="number" required min={0} max={10} step={0.1} value={fields.body} onChange={(e) => set("body", e.target.value)} {...inputClass} />
          </Field>
          <Field label="Sweetness *">
            <input type="number" required min={0} max={10} step={0.1} value={fields.sweetness} onChange={(e) => set("sweetness", e.target.value)} {...inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Pricing and stock">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price per kg (USD) *">
            <input type="number" required min={0.01} step={0.01} value={fields.price_per_kg} onChange={(e) => set("price_per_kg", e.target.value)} {...inputClass} />
          </Field>
          <Field label="Stock (kg)">
            <input type="number" min={0} step={0.1} value={fields.stock_kg} onChange={(e) => set("stock_kg", e.target.value)} {...inputClass} />
          </Field>
        </div>
        <Field label="Availability status">
          <select value={fields.status} onChange={(e) => set("status", e.target.value)} {...selectClass}>
            {Object.entries(BEAN_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Story">
        <Field label="Producer story">
          <textarea
            rows={4}
            value={fields.producer_story}
            onChange={(e) => set("producer_story", e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
          />
        </Field>
      </Section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add bean"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-5 py-2.5 text-sm text-text-2 hover:text-text"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-border bg-surface p-5">
      <legend className="mb-4 text-sm font-semibold text-text">{title}</legend>
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-text-3">{label}</span>
      {children}
    </label>
  );
}

const inputClass = {
  className:
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand-500",
};

const selectClass = {
  className:
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500",
};
