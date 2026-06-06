import React, { useEffect, useRef, useState } from "react";
import { Minus, Plus, X, Maximize2, RotateCcw } from "lucide-react";

interface ImagePreviewModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  src,
  alt,
  onClose,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const updateFitScale = () => {
      const image = imageRef.current;
      const container = containerRef.current;

      if (!image || !container || !image.naturalWidth || !image.naturalHeight) {
        return;
      }

      const padding = 48;
      const availableWidth = Math.max(container.clientWidth - padding * 2, 1);
      const availableHeight = Math.max(container.clientHeight - padding * 2, 1);
      const widthScale = availableWidth / image.naturalWidth;
      const heightScale = availableHeight / image.naturalHeight;

      setNaturalSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setBaseScale(Math.min(widthScale, heightScale, 1));
    };

    updateFitScale();
    window.addEventListener("resize", updateFitScale);

    return () => {
      window.removeEventListener("resize", updateFitScale);
    };
  }, [src]);

  const effectiveScale = baseScale * zoom;

  const handleZoomIn = () => setZoom((current) => Math.min(current * 1.25, 5));
  const handleZoomOut = () =>
    setZoom((current) => Math.max(current / 1.25, 0.1));

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const zoomSensitivity = 0.001;
      const delta = -event.deltaY * zoomSensitivity;

      setZoom((current) => {
        const nextZoom = current * Math.exp(delta);
        return Math.max(0.1, Math.min(nextZoom, 5));
      });
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      stage.removeEventListener("wheel", handleWheel);
    };
  }, [src]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragState?.active) return;

      setPan({
        x: dragState.startPanX + (event.clientX - dragState.startX),
        y: dragState.startPanY + (event.clientY - dragState.startY),
      });
    };

    const handleMouseUp = () => setDragState(null);

    if (dragState?.active) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState]);

  return (
    <div
      className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="landmark-modal-panel w-full h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
        aria-modal="true"
        role="dialog"
      >
        <div className="landmark-modal-header px-6 py-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 brand-text" />
            <div>
              <h2 className="text-xl font-bold landmark-modal-title">
                Image Preview
              </h2>
              <p className="text-sm landmark-modal-subtitle">
                Drag, use the mouse wheel or buttons to zoom, and inspect the
                image in full screen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="landmark-modal-close p-2 rounded-full transition-colors"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={stageRef}
          className="landmark-modal-stage flex-1 overflow-hidden flex items-center justify-center p-8 select-none relative"
          onMouseDown={(event) => {
            event.preventDefault();
            setDragState({
              active: true,
              startX: event.clientX,
              startY: event.clientY,
              startPanX: pan.x,
              startPanY: pan.y,
            });
          }}
        >
          <div
            className="relative inline-block shadow-2xl border border-primary cursor-grab active:cursor-grabbing"
            style={{
              width: naturalSize.width ? `${naturalSize.width}px` : "auto",
              height: naturalSize.height ? `${naturalSize.height}px` : "auto",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${effectiveScale})`,
              transformOrigin: "top left",
              maxWidth: "none",
            }}
          >
            <img
              ref={imageRef}
              src={src}
              alt={alt}
              onLoad={() => {
                const image = imageRef.current;
                const container = containerRef.current;

                if (!container || !image) return;

                const padding = 48;
                const availableWidth = Math.max(
                  container.clientWidth - padding * 2,
                  1,
                );
                const availableHeight = Math.max(
                  container.clientHeight - padding * 2,
                  1,
                );
                const widthScale = availableWidth / image.naturalWidth;
                const heightScale = availableHeight / image.naturalHeight;

                setNaturalSize({
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                });
                setBaseScale(Math.min(widthScale, heightScale, 1));
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              style={{
                width: naturalSize.width ? `${naturalSize.width}px` : "auto",
                height: naturalSize.height ? `${naturalSize.height}px` : "auto",
                display: "block",
                maxWidth: "none",
              }}
              draggable={false}
            />
          </div>
        </div>

        <div className="landmark-modal-footer px-6 py-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-secondary">Zoom:</span>
            <button
              type="button"
              onClick={handleZoomOut}
              className="px-4 py-2 rounded-xl font-medium text-secondary hover-bg transition-colors flex items-center gap-2"
              title="Zoom out"
            >
              <Minus className="w-4 h-4" />
              Out
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl font-medium text-secondary hover-bg transition-colors flex items-center gap-2"
              title="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="px-4 py-2 rounded-xl font-medium text-secondary hover-bg transition-colors flex items-center gap-2"
              title="Zoom in"
            >
              <Plus className="w-4 h-4" />
              In
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-secondary hover-bg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
