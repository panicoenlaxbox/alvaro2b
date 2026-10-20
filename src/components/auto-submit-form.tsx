"use client";

import { useRouter } from "next/navigation";
import type { FormHTMLAttributes } from "react";
import { filterQuery } from "@/lib/domain/explore";

/**
 * A filters form that applies itself as soon as a chip, checkbox or select changes; text fields wait
 * for Enter. It navigates to `action` with only the fields that filter something (see `filterQuery`).
 */
export function AutoSubmitForm({
  action,
  keepEmpty,
  ...rest
}: Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onChange" | "onSubmit"> & { action: string; keepEmpty?: string[] }) {
  const router = useRouter();

  return (
    <form
      {...rest}
      onChange={(event) => {
        const field = event.target as EventTarget as HTMLInputElement | HTMLSelectElement;
        if (field.type === "radio" || field.type === "checkbox" || field.tagName === "SELECT") event.currentTarget.requestSubmit();
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const entries = [...new FormData(event.currentTarget)].map(([key, value]) => [key, String(value)] as [string, string]);
        const query = filterQuery(entries, keepEmpty);
        router.push(query ? `${action}?${query}` : action, { scroll: false });
      }}
    />
  );
}
