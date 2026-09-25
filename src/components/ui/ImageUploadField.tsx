import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

type ImageSourceMode = "upload" | "url";

const inputClass =
  "w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all";
const labelClass = "block text-sm font-medium text-foreground-700 mb-1.5";

function detectImageSourceMode(
  value: string,
  file: File | null,
): ImageSourceMode {
  if (file) return "upload";
  if (value.startsWith("blob:") || value.startsWith("data:")) return "upload";
  return "url";
}

export type ImageUploadChange = { url: string; file: File | null };

export default function ImageUploadField({
  label,
  value,
  file,
  onChange,
  aspectW,
  aspectH,
  previewClassName,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  file: File | null;
  onChange: (next: ImageUploadChange) => void;
  aspectW?: number;
  aspectH?: number;
  /** Override preview image classes (default: full-width h-44). */
  previewClassName?: string;
  placeholder?: string;
  hint?: string;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ImageSourceMode>(() =>
    detectImageSourceMode(value, file),
  );
  const [preview, setPreview] = useState(value);
  const [urlInput, setUrlInput] = useState(
    value.startsWith("data:") || value.startsWith("blob:") ? "" : value,
  );

  useEffect(() => {
    setPreview(value);
    setUrlInput(
      value.startsWith("data:") || value.startsWith("blob:") ? "" : value,
    );
    // Only sync mode from props when there is content — empty clear must keep
    // the mode the user just selected (e.g. switch to upload).
    if (file || value) {
      setMode(detectImageSourceMode(value, file));
    }
  }, [value, file]);

  const clearValue = () => {
    setPreview("");
    setUrlInput("");
    onChange({ url: "", file: null });
  };

  const switchMode = (next: ImageSourceMode) => {
    if (next === mode) return;
    setMode(next);
    setPreview("");
    setUrlInput("");
    onChange({ url: "", file: null });
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;
    const objectUrl = URL.createObjectURL(nextFile);
    setPreview(objectUrl);
    setUrlInput("");
    onChange({ url: objectUrl, file: nextFile });
    e.target.value = "";
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    setPreview(url);
    onChange({ url, file: null });
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {hint && <p className="text-[11px] text-foreground-400 mb-2">{hint}</p>}

      <div className="flex gap-1 p-1 mb-3 rounded-xl bg-background-100 border border-background-200/70">
        <button
          type="button"
          onClick={() => switchMode("upload")}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer min-h-[40px] ${
            mode === "upload"
              ? "bg-background-50 text-primary-600 shadow-sm"
              : "text-foreground-500 hover:text-foreground-700"
          }`}
        >
          <i className="ri-upload-2-line mr-1"></i>
          {t("adminUi.businessConfig.imageSourceUpload")}
        </button>
        <button
          type="button"
          onClick={() => switchMode("url")}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer min-h-[40px] ${
            mode === "url"
              ? "bg-background-50 text-primary-600 shadow-sm"
              : "text-foreground-500 hover:text-foreground-700"
          }`}
        >
          <i className="ri-link mr-1"></i>
          {t("adminUi.businessConfig.imageSourceUrl")}
        </button>
      </div>

      {preview ? (
        <div className="relative mb-3">
          <img
            src={preview}
            alt=""
            className={
              previewClassName ||
              "w-full rounded-xl object-cover border border-background-200/70 h-44"
            }
            style={
              aspectW && aspectH
                ? { aspectRatio: `${aspectW}/${aspectH}` }
                : undefined
            }
          />
          <button
            type="button"
            onClick={clearValue}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xs"></i>
          </button>
        </div>
      ) : null}

      {mode === "upload" && !preview ? (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-background-200/70 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-background-100 transition-colors">
          <i className="ri-image-add-line text-2xl text-foreground-400 mb-1"></i>
          <span className="text-sm text-foreground-500">
            {placeholder || t("adminUi.businessConfig.uploadImage")}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      ) : null}

      {mode === "url" ? (
        <input
          type="text"
          value={urlInput}
          onChange={(e) => handleUrlChange(e.target.value)}
          className={inputClass}
          placeholder={t("adminUi.businessConfig.enterImageUrl")}
        />
      ) : null}

      {mode === "upload" && preview ? (
        <label className="inline-flex items-center gap-1.5 mt-1 text-xs text-primary-600 hover:text-primary-700 cursor-pointer">
          <i className="ri-refresh-line"></i>
          {t("adminUi.businessConfig.replaceUploadedImage")}
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      ) : null}
    </div>
  );
}
