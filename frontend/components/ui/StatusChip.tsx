import { BEAN_STATUS, type BeanStatus } from "@/product.config";

const COLOR_MAP: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};

export function StatusChip({ status }: { status: BeanStatus }) {
  const config = BEAN_STATUS[status] ?? { label: status, color: "info" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_MAP[config.color] ?? "bg-surface-3 text-text-2"}`}
    >
      {config.label}
    </span>
  );
}
