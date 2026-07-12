"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-md bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-taupe-dark disabled:cursor-wait disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
