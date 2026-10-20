import { fitWithin } from "@/lib/domain/image-size";

function supportsWebp(): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image encoding failed"))), type, quality),
  );
}

export type CompressedImage = { blob: Blob; width: number; height: number; type: string; extension: string };

/**
 * Resizes and re-encodes an image in the browser (WebP, or JPEG where WebP is not supported).
 * Quality drops step by step until the file fits targetBytes. Originals are never uploaded.
 */
export async function compressImage(file: Blob, maxSide: number, targetBytes = Infinity): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const type = supportsWebp() ? "image/webp" : "image/jpeg";
  let quality = 0.82;
  let blob = await toBlob(canvas, type, quality);
  while (blob.size > targetBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await toBlob(canvas, type, quality);
  }

  return { blob, width, height, type, extension: type === "image/webp" ? "webp" : "jpg" };
}
