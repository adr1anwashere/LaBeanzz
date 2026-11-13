/**
 * product.config.ts
 *
 * Single source of truth for labels, units, currency, and flavor axes.
 * Import from here — never hardcode these values in components.
 */

// ─── Currency ────────────────────────────────────────────────────────────────

export const CURRENCY = {
  code: "USD",
  symbol: "$",
  locale: "en-US",
} as const;

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: "currency",
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Units ───────────────────────────────────────────────────────────────────

export const UNITS = {
  weight: "kg",
  weightShort: "kg",
  percentage: "%",
} as const;

// ─── Bean status labels ───────────────────────────────────────────────────────

export const BEAN_STATUS = {
  AVAILABLE: { label: "Available", color: "success" },
  LOW_STOCK: { label: "Low stock", color: "warning" },
  RESERVED: { label: "Reserved", color: "info" },
  OUT_OF_STOCK: { label: "Out of stock", color: "danger" },
} as const;

export type BeanStatus = keyof typeof BEAN_STATUS;

// ─── Roast levels ─────────────────────────────────────────────────────────────

export const ROAST_LEVELS = [
  { value: "LIGHT", label: "Light" },
  { value: "MEDIUM_LIGHT", label: "Medium-light" },
  { value: "MEDIUM", label: "Medium" },
  { value: "MEDIUM_DARK", label: "Medium-dark" },
  { value: "DARK", label: "Dark" },
] as const;

export type RoastLevel = (typeof ROAST_LEVELS)[number]["value"];

// ─── Flavor axes (1–10 scale) ─────────────────────────────────────────────────

export const FLAVOR_AXES = [
  {
    key: "acidity",
    label: "Acidity",
    description: "Bright, tangy, citrusy character",
    low: "Flat",
    high: "Bright",
  },
  {
    key: "body",
    label: "Body",
    description: "Weight and texture in the mouth",
    low: "Tea-like",
    high: "Full",
  },
  {
    key: "sweetness",
    label: "Sweetness",
    description: "Natural perceived sweetness",
    low: "Dry",
    high: "Sweet",
  },
] as const;

export type FlavorKey = (typeof FLAVOR_AXES)[number]["key"];

// ─── Order status labels & timeline ─────────────────────────────────────────

export const ORDER_STATUS = {
  PENDING: { label: "Pending", step: 0 },
  CONFIRMED: { label: "Confirmed", step: 1 },
  PREPARING: { label: "Preparing", step: 2 },
  READY: { label: "Ready", step: 3 },
  SHIPPED: { label: "Shipped", step: 4 },
  DELIVERED: { label: "Delivered", step: 5 },
  CANCELLED: { label: "Cancelled", step: -1 },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS;

export const ORDER_TIMELINE = [
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SHIPPED",
  "DELIVERED",
] as const satisfies OrderStatus[];

// ─── Blend status labels ──────────────────────────────────────────────────────

export const BLEND_STATUS = {
  DRAFT: { label: "Draft" },
  ACTIVE: { label: "Active" },
  ARCHIVED: { label: "Archived" },
} as const;

export type BlendStatus = keyof typeof BLEND_STATUS;

// ─── Pagination default ───────────────────────────────────────────────────────

export const PAGE_SIZE = 20;
