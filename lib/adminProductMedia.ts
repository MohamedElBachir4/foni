import { API_URL, getToken } from "@/lib/adminAuth";

export const MAX_EXTRA_IMAGES = 9;
export const MAX_TOTAL_IMAGES = 10;
export const MAX_IMAGES_PER_UPLOAD = 10;

export function parseExtraImagesFromText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) =>
      line
        .split(/,\s*/u)
        .map((url) => url.trim())
        .filter(Boolean)
    )
    .filter(Boolean)
    .slice(0, MAX_EXTRA_IMAGES);
}

export async function uploadProductImages(files: FileList | null): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const formData = new FormData();
  Array.from(files)
    .slice(0, MAX_IMAGES_PER_UPLOAD)
    .forEach((file) => formData.append("images", file));
  const token = getToken();
  const res = await fetch(`${API_URL}/api/uploads/images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "فشل رفع الصور");
  return Array.isArray(data.urls) ? data.urls : [];
}

export async function uploadProductVideo(file: File | null): Promise<string> {
  if (!file) return "";
  const formData = new FormData();
  formData.append("video", file);
  const token = getToken();
  const res = await fetch(`${API_URL}/api/uploads/video`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "فشل رفع الفيديو");
  return typeof data.url === "string" ? data.url : "";
}
