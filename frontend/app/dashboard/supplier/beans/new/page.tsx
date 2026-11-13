import { BeanForm } from "@/components/features/BeanForm";

export default function NewBeanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Add a new bean</h1>
        <p className="mt-1 text-sm text-text-3">
          Fill in the details and click "Add bean" to list it on the platform.
        </p>
      </div>
      <BeanForm />
    </div>
  );
}
