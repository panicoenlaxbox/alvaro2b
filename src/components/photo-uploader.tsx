"use client";

import { useRef, useState, useTransition } from "react";
import { recordPhotos, type UploadedPhoto } from "@/app/(app)/photos/actions";
import { PHOTO_MAX_SIDE, PHOTO_TARGET_BYTES, THUMB_MAX_SIDE } from "@/lib/domain/image-size";
import { compressImage } from "@/lib/image-client";
import { createClient } from "@/lib/supabase/client";

/** Compresses Photos in the browser (no originals are kept) and uploads them with a thumbnail. */
export function PhotoUploader({ sessionId }: { sessionId: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function upload(files: File[]) {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const uploaded: UploadedPhoto[] = [];
      try {
        for (const [i, file] of files.entries()) {
          setStatus(`Preparando ${i + 1} de ${files.length}…`);
          const [full, thumb] = await Promise.all([
            compressImage(file, PHOTO_MAX_SIDE, PHOTO_TARGET_BYTES),
            compressImage(file, THUMB_MAX_SIDE, 60 * 1024),
          ]);
          const id = crypto.randomUUID();
          const path = `photos/${id}.${full.extension}`;
          const thumbPath = `photos/thumbs/${id}.${thumb.extension}`;
          setStatus(`Subiendo ${i + 1} de ${files.length}…`);
          const results = await Promise.all([
            supabase.storage.from("media").upload(path, full.blob, { contentType: full.type }),
            supabase.storage.from("media").upload(thumbPath, thumb.blob, { contentType: thumb.type }),
          ]);
          if (results.some((r) => r.error)) throw new Error("Upload failed");
          uploaded.push({ path, thumbPath, width: full.width, height: full.height, sizeBytes: full.blob.size });
        }
        const result = await recordPhotos(sessionId, uploaded);
        setStatus(result.message ?? null);
        if (result.error) setError(result.error);
      } catch {
        setStatus(null);
        setError("No se han podido subir las fotos. Vuelve a intentarlo.");
        if (uploaded.length) await recordPhotos(sessionId, uploaded);
      }
    });
  }

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-label="Elegir fotos"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) upload(files);
          e.target.value = "";
        }}
      />
      <button type="button" className="btn-secondary" disabled={pending} onClick={() => input.current?.click()}>
        {pending ? "Subiendo…" : "+ Subir fotos"}
      </button>
      {status && <p className="text-sm text-muted">{status}</p>}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
