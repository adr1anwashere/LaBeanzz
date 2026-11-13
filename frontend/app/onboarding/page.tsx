"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { AppSession } from "@/lib/session";

type Role = "OWNER" | "SUPPLIER";

interface FormState {
  role: Role | null;
  businessName: string;
  companyName: string;
  location: string;
  contactEmail: string;
  website: string;
}

export default function OnboardingPage() {
  const { data: rawSession, update } = useSession();
  const session = rawSession as AppSession | null;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    role: null,
    businessName: "",
    companyName: "",
    location: "",
    contactEmail: "",
    website: "",
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.role) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/proxy/auth/onboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.appToken}`,
          },
          body: JSON.stringify({
            role: form.role,
            business_name: form.businessName || undefined,
            company_name: form.companyName || undefined,
            location: form.location || undefined,
            contact_email: form.contactEmail || undefined,
            website: form.website || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }

        const data = await res.json();
        await update({ appToken: data.token, role: data.user.role });

        router.replace(
          data.user.role === "OWNER" ? "/dashboard/owner" : "/dashboard/supplier"
        );
      } catch {
        setError("Could not reach the server. Please try again.");
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight text-brand-700">
            LaBeans
          </span>
        </div>

        <h1 className="mb-2 text-xl font-semibold text-text">
          Welcome! Tell us about yourself.
        </h1>
        <p className="mb-6 text-sm text-text-3">
          Choose a role — you won&apos;t be able to change this later.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Role selector */}
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="sr-only">Your role</legend>
            {(["OWNER", "SUPPLIER"] as Role[]).map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer flex-col gap-1 rounded-lg border-2 p-4 transition-colors ${
                  form.role === r
                    ? "border-brand-500 bg-brand-50"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={form.role === r}
                  onChange={() => set("role", r)}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-text">
                  {r === "OWNER" ? "☕ Roaster / Owner" : "🌱 Supplier"}
                </span>
                <span className="text-xs text-text-3">
                  {r === "OWNER"
                    ? "Create blends and place orders"
                    : "List beans and fulfil orders"}
                </span>
              </label>
            ))}
          </fieldset>

          {/* Owner-specific fields */}
          {form.role === "OWNER" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text" htmlFor="businessName">
                Business name <span className="text-text-3">(optional)</span>
              </label>
              <input
                id="businessName"
                type="text"
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                placeholder="Sunrise Roasters"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Supplier-specific fields */}
          {form.role === "SUPPLIER" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text" htmlFor="companyName">
                  Company name <span className="text-danger text-xs">*</span>
                </label>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder="Highlands Green Coffee"
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text" htmlFor="location">
                  Location <span className="text-text-3">(optional)</span>
                </label>
                <input
                  id="location"
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Medellin, Colombia"
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text" htmlFor="contactEmail">
                  Contact email <span className="text-text-3">(optional)</span>
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  placeholder="hello@example.com"
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!form.role || isPending}
            className="mt-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {isPending ? "Setting up your account…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
