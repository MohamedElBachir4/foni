"use client";

import {
  MAX_EXTRA_IMAGES,
  parseExtraImagesFromText,
  uploadProductImages,
  uploadProductVideo,
} from "@/lib/adminProductMedia";

const fld =
  "admin-input !h-7 !rounded-md !px-2 !py-1 text-[11px] text-slate-800 placeholder:text-slate-400";
const lbl = "mb-0.5 block text-[10px] font-medium text-slate-500";

type AdminProductMediaFieldsProps = {
  image: string;
  extraImagesText: string;
  video: string;
  onImageChange: (value: string) => void;
  onExtraImagesTextChange: (value: string) => void;
  onVideoChange: (value: string) => void;
  uploading: boolean;
  onUploadingChange: (value: boolean) => void;
  onNotice: (notice: { type: "success" | "error"; text: string } | null) => void;
};

export function AdminProductMediaFields({
  image,
  extraImagesText,
  video,
  onImageChange,
  onExtraImagesTextChange,
  onVideoChange,
  uploading,
  onUploadingChange,
  onNotice,
}: AdminProductMediaFieldsProps) {
  return (
    <div className="border-t border-slate-100 pt-2">
      <label className={lbl}>رابط الصورة الرئيسية</label>
      <input
        type="text"
        value={image}
        onChange={(e) => onImageChange(e.target.value)}
        className={fld}
        placeholder="https://…"
        dir="ltr"
      />
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <div className="min-w-0">
          <label className={`${lbl} truncate`}>رفع رئيسية</label>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            className="admin-input h-7 cursor-pointer rounded-md px-1.5 py-0 text-[10px] file:me-1 file:rounded file:border-0 file:bg-sky-50 file:px-1.5 file:text-[10px] file:text-sky-800"
            onChange={async (e) => {
              const input = e.currentTarget;
              onNotice(null);
              try {
                onUploadingChange(true);
                const urls = await uploadProductImages(e.target.files);
                if (urls[0]) {
                  onImageChange(urls[0]);
                  onNotice({ type: "success", text: "تم رفع الصورة الرئيسية" });
                }
              } catch (err) {
                onNotice({
                  type: "error",
                  text: err instanceof Error ? err.message : "فشل رفع الصورة",
                });
              } finally {
                onUploadingChange(false);
                input.value = "";
              }
            }}
          />
        </div>
        <div className="min-w-0">
          <label className={`${lbl} truncate`}>رفع حتى {MAX_EXTRA_IMAGES}</label>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            className="admin-input h-7 cursor-pointer rounded-md px-1.5 py-0 text-[10px] file:me-1 file:rounded file:border-0 file:bg-slate-50 file:px-1.5 file:text-[10px]"
            onChange={async (e) => {
              const input = e.currentTarget;
              onNotice(null);
              try {
                onUploadingChange(true);
                const uploaded = await uploadProductImages(e.target.files);
                if (uploaded.length > 0) {
                  const merged = [...parseExtraImagesFromText(extraImagesText), ...uploaded].slice(
                    0,
                    MAX_EXTRA_IMAGES
                  );
                  onExtraImagesTextChange(merged.join("\n"));
                  onNotice({
                    type: "success",
                    text: `تم رفع ${uploaded.length} صورة إضافية`,
                  });
                }
              } catch (err) {
                onNotice({
                  type: "error",
                  text: err instanceof Error ? err.message : "فشل رفع الصور",
                });
              } finally {
                onUploadingChange(false);
                input.value = "";
              }
            }}
          />
        </div>
      </div>
      <div className="mt-1.5">
        <label className={lbl}>روابط إضافية ({MAX_EXTRA_IMAGES}) — حتى 10 صور مع الرئيسية</label>
        <textarea
          value={extraImagesText}
          onChange={(e) => onExtraImagesTextChange(e.target.value)}
          rows={3}
          className={`${fld} !min-h-[3rem] resize-none py-1.5 leading-snug`}
          placeholder="سطر أو فاصلة لكل رابط"
          dir="ltr"
        />
      </div>

      <div className="mt-2 border-t border-slate-100 pt-2">
        <label className={lbl}>فيديو المنتج (اختياري)</label>
        <input
          type="text"
          value={video}
          onChange={(e) => onVideoChange(e.target.value)}
          className={fld}
          placeholder="https://… أو /uploads/videos/…"
          dir="ltr"
        />
        <div className="mt-1.5">
          <label className={`${lbl} truncate`}>رفع فيديو</label>
          <input
            type="file"
            accept="video/*"
            disabled={uploading}
            className="admin-input h-7 cursor-pointer rounded-md px-1.5 py-0 text-[10px] file:me-1 file:rounded file:border-0 file:bg-violet-50 file:px-1.5 file:text-[10px] file:text-violet-800"
            onChange={async (e) => {
              const input = e.currentTarget;
              const file = e.target.files?.[0];
              if (!file) return;
              onNotice(null);
              try {
                onUploadingChange(true);
                const url = await uploadProductVideo(file);
                if (url) {
                  onVideoChange(url);
                  onNotice({ type: "success", text: "تم رفع الفيديو" });
                }
              } catch (err) {
                onNotice({
                  type: "error",
                  text: err instanceof Error ? err.message : "فشل رفع الفيديو",
                });
              } finally {
                onUploadingChange(false);
                input.value = "";
              }
            }}
          />
          <p className="mt-1 text-[10px] text-slate-500">MP4 أو WebM — حتى 50 ميجابايت</p>
        </div>
      </div>
    </div>
  );
}
