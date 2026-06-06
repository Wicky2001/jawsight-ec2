import React, { useEffect, useRef, useState } from "react";
import { Upload, X, CheckCircle, AlertCircle, Edit3 } from "lucide-react";
import { ImagePreviewModal } from "../../helpers/ui/ImagePreviewModal";

interface UploadZoneProps {
  id: "left" | "right" | "front";
  title: string;
  subtitle: string;
  imageDataUrl: string | null;
  bgImage?: string;
  hasCsv?: boolean;
  showStatus?: boolean;
  showControls?: boolean;
  onUpload: (id: "left" | "right" | "front", dataUrl: string) => void;
  onRemove: (id: "left" | "right" | "front") => void;
  onError: (msg: string) => void;
  onEditMarks?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  id,
  title,
  subtitle,
  imageDataUrl,
  bgImage,
  hasCsv,
  showStatus = true,
  showControls = true,
  onUpload,
  onRemove,
  onError,
  onEditMarks,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!imageDataUrl && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imageDataUrl]);

  const processFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      onError("Invalid file type. Please upload a .jpg, .jpeg, or .png file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpload(id, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!imageDataUrl) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (imageDataUrl) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {previewSrc && (
        <ImagePreviewModal
          src={previewSrc}
          alt={title}
          onClose={() => setPreviewSrc(null)}
        />
      )}

      <div className="flex justify-between items-end">
        <span className="font-medium text-slate-700">{title}</span>
        {imageDataUrl && showStatus && (
          <span
            className={`text-xs font-semibold flex items-center gap-1 ${id === "front" && !hasCsv ? "text-amber-600" : "text-emerald-600"}`}
          >
            {id === "front" && !hasCsv ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <CheckCircle className="w-3 h-3" />
            )}
            {id === "front" && !hasCsv ? "Pending Marks" : "Uploaded"}
          </span>
        )}
      </div>

      <div
        onClick={() =>
          imageDataUrl
            ? setPreviewSrc(imageDataUrl)
            : fileInputRef.current?.click()
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-1 rounded-2xl transition-all duration-200 overflow-hidden min-h-[280px] flex flex-col items-center justify-center ${
          imageDataUrl
            ? "border-2 border-slate-200 shadow-sm bg-slate-900"
            : `border-2 border-dashed ${isDragging ? "border-teal-400 bg-teal-50" : "border-slate-300 bg-slate-50"} hover:bg-slate-100 hover:border-teal-400 cursor-pointer group`
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/jpg"
          className="hidden"
        />

        {!imageDataUrl && bgImage && (
          <div
            className="absolute inset-0 z-0 opacity-40 group-hover:opacity-50 transition-opacity"
            style={{
              backgroundImage: `url('${bgImage}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

        {imageDataUrl ? (
          <>
            <div className="absolute inset-0 z-10 flex items-center justify-center p-3">
              <img
                src={imageDataUrl}
                alt={title}
                className="w-full max-h-full object-contain cursor-zoom-in"
                draggable={false}
              />
            </div>

            {showControls && (
              <div className="absolute top-3 right-3 flex gap-2 z-20">
                {id === "front" && onEditMarks && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMarks();
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 text-sm font-medium border backdrop-blur-sm ${
                      hasCsv
                        ? "bg-slate-900/70 text-slate-200 border-slate-700/50 hover:bg-slate-800 hover:text-white"
                        : "bg-amber-500 text-amber-950 border-amber-400 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse"
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    {hasCsv ? "Edit Marks" : "Mark Points"}
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(id);
                  }}
                  className="flex items-center justify-center p-2 rounded-full transition-colors backdrop-blur-sm border bg-slate-900/70 text-slate-300 border-slate-700/50 hover:bg-red-500 hover:text-white hover:border-red-500"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="relative z-10 text-center p-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:text-teal-600 transition-all">
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="font-semibold text-slate-800 mb-1 bg-white/70 backdrop-blur-md px-3 py-1 rounded-lg">
              Click to upload
            </p>
            <p className="text-sm text-slate-700 w-full font-medium bg-white/70 backdrop-blur-md px-3 py-1 rounded-lg mt-1">
              {subtitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
