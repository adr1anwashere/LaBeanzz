import { apiFetch } from "./client";
import type { BeanStatus, RoastLevel } from "@/product.config";

export interface CoffeeBean {
  id: string;
  supplier_id: string;
  name: string;
  origin: string;
  region: string | null;
  farm: string | null;
  producer: string | null;
  varietal: string | null;
  altitude_m: number | null;
  processing_method: string | null;
  roast_level: RoastLevel;
  flavor_notes: string[];
  acidity: number;
  body: number;
  sweetness: number;
  price_per_kg: number;
  stock_kg: number;
  status: BeanStatus;
  producer_story: string | null;
  created_at: string;
  updated_at: string;
}

export interface BeansPage {
  items: CoffeeBean[];
  total: number;
  page: number;
  pages: number;
}

export interface BeanFilters {
  origin?: string;
  roast_level?: RoastLevel;
  status?: BeanStatus;
  max_price?: number;
  supplier_id?: string;
  page?: number;
  per_page?: number;
}

export interface CreateBeanPayload {
  name: string;
  origin: string;
  region?: string;
  farm?: string;
  producer?: string;
  varietal?: string;
  altitude_m?: number;
  processing_method?: string;
  roast_level: RoastLevel;
  flavor_notes?: string[];
  acidity: number;
  body: number;
  sweetness: number;
  price_per_kg: number;
  stock_kg?: number;
  status?: BeanStatus;
  producer_story?: string;
}

export type PatchBeanPayload = Partial<CreateBeanPayload>;

function buildQuery(filters: BeanFilters): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

/** Owner / Supplier: list beans with optional filters */
export function getBeans(filters: BeanFilters = {}): Promise<BeansPage> {
  return apiFetch<BeansPage>(`coffee-beans${buildQuery(filters)}`);
}

/** Owner / Supplier: single bean detail */
export function getBean(id: string): Promise<CoffeeBean> {
  return apiFetch<CoffeeBean>(`coffee-beans/${id}`);
}

/** Supplier: list own beans */
export function getSupplierBeans(filters: { page?: number; per_page?: number } = {}): Promise<BeansPage> {
  return apiFetch<BeansPage>(`supplier/beans${buildQuery(filters)}`);
}

/** Supplier: create bean */
export function createBean(payload: CreateBeanPayload): Promise<CoffeeBean> {
  return apiFetch<CoffeeBean>("supplier/beans", { method: "POST", body: payload });
}

/** Supplier: update bean */
export function updateBean(id: string, payload: PatchBeanPayload): Promise<CoffeeBean> {
  return apiFetch<CoffeeBean>(`supplier/beans/${id}`, { method: "PATCH", body: payload });
}

/** Supplier: delete bean */
export function deleteBean(id: string): Promise<void> {
  return apiFetch<void>(`supplier/beans/${id}`, { method: "DELETE" });
}
