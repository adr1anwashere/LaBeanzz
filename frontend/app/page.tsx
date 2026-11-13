import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AppSession } from "@/lib/session";

// This route always reads the session at request time — no prerendering
export const instant = false;

export default async function RootPage() {
  const session = (await auth()) as AppSession | null;

  if (!session) redirect("/login");

  const role = session.user?.role;
  if (!role) redirect("/onboarding");
  if (role === "OWNER") redirect("/dashboard/owner");
  redirect("/dashboard/supplier");
}
