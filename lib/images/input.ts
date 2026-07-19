const IMAGE_TYPES = ["image/jpeg", "image/png", "image/heic", "image/webp"] as const;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function isSupportedImage(file: Pick<File, "type">) {
  return IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number]);
}

export function validateImageFile(file: Pick<File, "size" | "type">) {
  if (!isSupportedImage(file)) throw new Error("Choose a JPG, PNG, HEIC, or WebP photo.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Choose a photo smaller than 10 MB.");
}

export function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The photo could not be read."));
    reader.readAsDataURL(file);
  });
}

export async function hashFile(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
