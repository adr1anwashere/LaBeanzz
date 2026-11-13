import { notFound } from "next/navigation";
import Link from "next/link";
import { BeanForm } from "@/components/features/BeanForm";
import { apiFetch } from "@/lib/api/client";
import type { CoffeeBean } from "@/lib/api/beans";
import { ApiError } from "@/lib/api/client";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBeanPage({ params }: Props) {
  const { id } = await params;

  let bean: CoffeeBean;
  try {
    bean = await apiFetch<CoffeeBean>(`supplier/beans/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/supplier/beans"
          className="text-sm text-text-3 hover:text-text"
        >
          ← Back to my beans
        </Link>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-text">Edit: {bean.name}</h1>
        <p className="mt-1 text-sm text-text-3">
          Update the bean details below.
        </p>
      </div>
      <BeanForm initial={bean} />
    </div>
  );
}
