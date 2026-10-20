/** File types allowed as Game attachments (mirrors the attachments bucket): documents and images. */
export const ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
];

export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

/** A normalized http(s) link, or null. A bare address such as "www.example.com" gets https. */
export function parseAttachmentLink(input: string): string | null {
  const text = input.trim();
  if (!text || /\s/.test(text)) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** "example.com/tools/hex-calculator": host and path, without www, query or trailing slash. */
export function linkLabel(url: string, max = 60): string {
  const { hostname, pathname } = new URL(url);
  const label = `${hostname.replace(/^www\./, "")}${pathname.replace(/\/$/, "")}`;
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/** Storage path for an uploaded file: games/<game>/<id>-<safe name>.<ext>. */
export function attachmentPath(gameId: string, fileName: string, id: string): string {
  const dot = fileName.lastIndexOf(".");
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot > 0 ? fileName.slice(0, dot) : fileName)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `games/${gameId}/${id}-${base || "file"}${ext ? `.${ext}` : ""}`;
}

/** Why a file cannot be attached, or null when it can. */
export function checkAttachmentFile(file: { type: string; size: number }): string | null {
  if (!ATTACHMENT_TYPES.includes(file.type)) return "Ese tipo de fichero no se admite: sube un PDF, una imagen, un texto o un documento.";
  if (file.size > ATTACHMENT_MAX_BYTES) return "El fichero pasa de 20 MB.";
  return null;
}

/** "2,4 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
}
