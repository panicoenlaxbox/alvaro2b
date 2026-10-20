"use client";

import { zip } from "fflate";
import { useState } from "react";

const PART_SIZE = 100;

type PhotoFile = { name: string; url: string | null };

function zipFiles(files: Record<string, Uint8Array>): Promise<Uint8Array> {
  // Photos are already compressed: store them without deflating again.
  return new Promise((resolve, reject) => zip(files, { level: 0 }, (err, data) => (err ? reject(err) : resolve(data))));
}

function save(data: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function PhotoZipDownloader() {
  const [photos, setPhotos] = useState<PhotoFile[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setStatus("Buscando fotos…");
    const response = await fetch("/api/export/photos");
    if (!response.ok) {
      setStatus("No se ha podido preparar la descarga.");
      setBusy(false);
      return;
    }
    const list = (await response.json()) as PhotoFile[];
    setPhotos(list);
    setStatus(list.length ? `${list.length} fotos.` : "Aún no hay fotos.");
    setBusy(false);
  }

  async function download(part: number) {
    if (!photos) return;
    setBusy(true);
    const slice = photos.slice(part * PART_SIZE, (part + 1) * PART_SIZE);
    const files: Record<string, Uint8Array> = {};
    let failed = 0;
    for (const [i, photo] of slice.entries()) {
      setStatus(`Parte ${part + 1}: descargando ${i + 1} de ${slice.length}…`);
      try {
        if (!photo.url) throw new Error("No URL");
        const res = await fetch(photo.url);
        if (!res.ok) throw new Error(String(res.status));
        files[photo.name] = new Uint8Array(await res.arrayBuffer());
      } catch {
        failed++;
      }
    }
    setStatus(`Parte ${part + 1}: comprimiendo…`);
    save(await zipFiles(files), `alvaro2b-fotos-parte-${part + 1}.zip`);
    setStatus(failed ? `Parte ${part + 1} lista, pero ${failed} fotos fallaron.` : `Parte ${part + 1} lista.`);
    setBusy(false);
  }

  const parts = photos ? Math.ceil(photos.length / PART_SIZE) : 0;

  return (
    <div className="space-y-2">
      {!photos && (
        <button type="button" className="btn-secondary" disabled={busy} onClick={load}>
          Preparar descarga de fotos
        </button>
      )}
      {parts > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: parts }, (_, i) => (
            <button key={i} type="button" className="btn-secondary" disabled={busy} onClick={() => download(i)}>
              Parte {i + 1} ({Math.min(PART_SIZE, photos!.length - i * PART_SIZE)})
            </button>
          ))}
        </div>
      )}
      {status && (
        <p className="text-sm text-muted" aria-live="polite">
          {status}
        </p>
      )}
    </div>
  );
}
