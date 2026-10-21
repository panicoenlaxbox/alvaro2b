"use client";

import { useRouter } from "next/navigation";
import type { FormHTMLAttributes } from "react";
import { filterQuery } from "@/lib/domain/explore";

type FilterFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & { action: string; keepEmpty?: string[] };

/** A GET filters form that navigates to `action` with only the fields that filter something (see `filterQuery`). */
export function FilterForm({ action, keepEmpty, ...rest }: FilterFormProps) {
  const router = useRouter();

  return (
    <form
      {...rest}
      onSubmit={(event) => {
        event.preventDefault();
        const entries = [...new FormData(event.currentTarget)].map(([key, value]) => [key, String(value)] as [string, string]);
        const query = filterQuery(entries, keepEmpty);
        router.push(query ? `${action}?${query}` : action, { scroll: false });
      }}
    />
  );
}

/** A FilterForm that applies itself as soon as a chip, checkbox or select changes; text fields wait for Enter. */
export function AutoSubmitForm(props: Omit<FilterFormProps, "onChange">) {
  return (
    <FilterForm
      {...props}
      onChange={(event) => {
        const field = event.target as EventTarget as HTMLInputElement | HTMLSelectElement;
        if (field.type === "radio" || field.type === "checkbox" || field.tagName === "SELECT") event.currentTarget.requestSubmit();
      }}
    />
  );
}
