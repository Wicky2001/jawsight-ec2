import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { ImagePreviewModal } from "./ImagePreviewModal";
import LoadingSpinner from "./LoadingSpinner";

interface ImageCardProps {
  title: string;
  url?: string | null;
  isLoading?: boolean;
}

const ImageCard = ({ title, url, isLoading = false }: ImageCardProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full md:w-[300px] h-auto md:h-[500px] 2xl:h-[600px] cursor-zoom-in">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-teal-600" />
            {title}
          </h3>
        </div>
        <div
          className="flex-1 bg-slate-900 relative flex items-center justify-center p-2 cursor-pointer hover:bg-slate-800 transition-colors"
          onClick={() =>
            url && !isLoading && !imageError && setShowPreview(true)
          }
        >
          {isLoading ? (
            <LoadingSpinner
              centered
              label="Loading image..."
              spinnerClassName="w-8 h-8"
              labelClassName="text-slate-400 text-sm"
            />
          ) : url && !imageError ? (
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              onError={() => setImageError(true)}
            />
          ) : null}

          {!isLoading && (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-100 ${
                url && !imageError ? "hidden" : "flex"
              }`}
            >
              <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-sm font-medium">
                {imageError
                  ? "Image failed to load"
                  : "Image unavailable or expired"}
              </span>
            </div>
          )}
        </div>
      </div>

      {showPreview && url && (
        <ImagePreviewModal
          src={url}
          alt={title}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default ImageCard;
