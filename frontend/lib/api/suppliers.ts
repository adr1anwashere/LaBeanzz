import { apiFetch } from "./client";

export interface Supplier {
  id: string;
  business_name: string;
  description: string | null;
  location: string | null;
  created_at: string;
}

export interface SuppliersResponse {
  items: Supplier[];
}

export function getSuppliers(): Promise<SuppliersResponse> {
  return apiFetch<SuppliersResponse>("suppliers");
}

export function getSupplier(id: string): Promise<Supplier> {
  return apiFetch<Supplier>(`suppliers/${id}`);
}
