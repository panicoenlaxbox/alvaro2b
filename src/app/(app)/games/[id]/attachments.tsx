"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ActionForm, ConfirmSubmitButton, FormMessage, SubmitButton, useAddAction } from "@/components/form";
import { FILE, Icon, LINK, PAPERCLIP } from "@/components/icon";
import { initialActionState } from "@/lib/action-state";
import { ATTACHMENT_TYPES, attachmentPath, checkAttachmentFile, formatBytes, linkLabel } from "@/lib/domain/attachments";
import { createClient } from "@/lib/supabase/client";
import { addAttachmentLink, deleteAttachment, recordAttachmentFile } from "./attachment-actions";

export type AttachmentItem =
  | { id: string; kind: "link"; url: string }
  | { id: string; kind: "file"; url: string | null; fileName: string; sizeBytes: number };

/** Files and links of a Game: a list to open them, plus forms to add a link or upload a file. */
export function Attachments({ gameId, items }: { gameId: string; items: AttachmentItem[] }) {
  const [linkState, linkAction, linksAdded] = useAddAction(addAttachmentLink);

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <AttachmentRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      <ActionForm key={linksAdded} action={linkAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="game_id" value={gameId} />
        <input name="url" type="url" inputMode="url" required placeholder="https://…" aria-label="Enlace" className="input" />
        <SubmitButton className="btn-secondary shrink-0" pendingText="…">
          <Icon d={LINK} className="size-4" />
          Añadir enlace
        </SubmitButton>
      </ActionForm>
      <FormMessage state={linkState} />

      <FileUploader gameId={gameId} />
    </div>
  );
}

function AttachmentRow({ item }: { item: AttachmentItem }) {
  const [state, action] = useActionState(deleteAttachment, initialActionState);
  return (
    <li className="space-y-1 py-2">
      <div className="flex items-center gap-2">
        <Icon d={item.kind === "link" ? LINK : FILE} className="size-4 shrink-0 text-muted" />
        {item.url ? (
          <a href={item.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate underline">
            {item.kind === "link" ? linkLabel(item.url) : item.fileName}
          </a>
        ) : (
          <span className="min-w-0 flex-1 truncate">{item.kind === "file" ? item.fileName : ""}</span>
        )}
        {item.kind === "file" && <span className="shrink-0 text-xs text-muted">{formatBytes(item.sizeBytes)}</span>}
        <form action={action}>
          <input type="hidden" name="id" value={item.id} />
          <ConfirmSubmitButton confirmText="Sí, eliminar">
            Eliminar
          </ConfirmSubmitButton>
        </form>
      </div>
      <FormMessage state={state} />
    </li>
  );
}

function FileUploader({ gameId }: { gameId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function upload(file: File) {
    const problem = checkAttachmentFile(file);
    if (problem) return setError(problem);
    setError(null);
    startTransition(async () => {
      const path = attachmentPath(gameId, file.name, crypto.randomUUID());
      const { error: uploadError } = await createClient().storage.from("attachments").upload(path, file, { contentType: file.type });
      if (uploadError) return setError("No se ha podido subir el fichero. Vuelve a intentarlo.");
      const result = await recordAttachmentFile(gameId, { path, fileName: file.name, sizeBytes: file.size });
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-1">
      <input
        ref={input}
        type="file"
        accept={ATTACHMENT_TYPES.join(",")}
        className="hidden"
        aria-label="Elegir fichero"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
      <button type="button" className="btn-secondary w-full sm:w-auto" disabled={pending} onClick={() => input.current?.click()}>
        {pending ? (
          "Subiendo…"
        ) : (
          <>
            <Icon d={PAPERCLIP} className="size-4" />
            Añadir fichero
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
