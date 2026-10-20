"use client";

import Form from "next/form";
import type { ComponentProps } from "react";

/** A GET form that applies itself as soon as a chip, checkbox or select changes; text fields wait for Enter. */
export function AutoSubmitForm(props: Omit<ComponentProps<typeof Form>, "onChange">) {
  return (
    <Form
      scroll={false}
      {...props}
      onChange={(event) => {
        const field = event.target as EventTarget as HTMLInputElement | HTMLSelectElement;
        if (field.type === "radio" || field.type === "checkbox" || field.tagName === "SELECT") event.currentTarget.requestSubmit();
      }}
    />
  );
}
