import React, { useState, useRef, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let visionTasksPromise: Promise<
  Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>
> | null = null;
let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null;

const getFaceLandmarker = async () => {
  if (!visionTasksPromise) {
    visionTasksPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    );
  }

  const vision = await visionTasksPromise;

  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numFaces: 1,
    });
  }

  return faceLandmarkerPromise;
};

interface Point {
  id: number;
  x: number;
  y: number;
}

interface LandmarkModalProps {
  imageSrc: string;
  onSave: (csv: string, points: Point[]) => void;
  onClose: () => void;
  existingPoints: Point[] | null;
}

export const LandmarkModal: React.FC<LandmarkModalProps> = ({
  imageSrc,
  onSave,
  onClose,
  existingPoints,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [isDetecting, setIsDetecting] = useState(
    !existingPoints || existingPoints.length === 0,
  );

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [markerSize, setMarkerSize] = useState(14); // default 14px (equivalent to w-3.5 h-3.5)
  const hasInitializedDetectionRef = useRef(false);
  const [dragState, setDragState] = useState<{
    type: "point" | "pan" | null;
    id?: number;
    startX?: number;
    startY?: number;
    startPanX?: number;
    startPanY?: number;
  }>({ type: null });
  const stageRef = useRef<HTMLDivElement>(null);

  const loadDefaultPoints = () => {
    const defaultPoints: Point[] = [];
    // 1. Nose
    defaultPoints.push({ id: 1, x: 50, y: 55 });

    // 2. Jaw (15 points) - Arc shape
    const jawIds = [
      58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288,
    ];
    jawIds.forEach((id, i) => {
      const fraction = i / (jawIds.length - 1);
      const angle = Math.PI - fraction * Math.PI;
      const nx = 50 + 30 * Math.cos(angle);
      const ny = 55 + 35 * Math.sin(angle);
      defaultPoints.push({ id, x: nx, y: ny });
    });

    // 3. Lips (20 points) - Oval shape
    const lipIds = [
      61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0,
      37, 39, 40, 185,
    ];
    lipIds.forEach((id, i) => {
      const fraction = i / lipIds.length;
      const angle = fraction * 2 * Math.PI;
      const x = 50 + 12 * Math.cos(angle);
      const y = 78 + 5 * Math.sin(angle);
      defaultPoints.push({ id, x, y });
    });

    setPoints(defaultPoints);
  };

  // Initialize Points
  useEffect(() => {
    if (existingPoints && existingPoints.length > 0) {
      setPoints(existingPoints);
    }
  }, [existingPoints]);

  const handleImageLoad = async () => {
    // If we already have user-edited points, skip auto-detection
    if (existingPoints && existingPoints.length > 0) return;
    if (hasInitializedDetectionRef.current) return;

    hasInitializedDetectionRef.current = true;

    try {
      const landmarker = await getFaceLandmarker();

      if (!imgRef.current) return;

      const results = landmarker.detect(imgRef.current);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        const targetIds = [
          1, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365,
          397, 288, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270,
          269, 267, 0, 37, 39, 40, 185,
        ];

        const autoPts = targetIds.map((id) => ({
          id,
          x: landmarks[id].x * 100, // Convert normalized 0-1 to percentage 0-100
          y: landmarks[id].y * 100,
        }));

        setPoints(autoPts);
      } else {
        console.warn("No face detected, loading fallback points.");
        loadDefaultPoints();
      }
    } catch (err) {
      console.error("Auto-detection failed, using fallback:", err);
      loadDefaultPoints();
    } finally {
      setIsDetecting(false);
    }
  };

  // Dragging logic attached to window for smooth movement out of bounds
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.type) return;

      if (dragState.type === "point" && dragState.id && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setPoints((pts) =>
          pts.map((p) => (p.id === dragState.id ? { ...p, x, y } : p)),
        );
      } else if (dragState.type === "pan" && dragState.startX !== undefined) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY!;
        setPan({
          x: dragState.startPanX! + dx,
          y: dragState.startPanY! + dy,
        });
      }
    };

    const handleMouseUp = () => setDragState({ type: null });

    if (dragState.type !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState]);

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -event.deltaY * zoomSensitivity;

      setScale((prevScale) => {
        let newScale = prevScale * Math.exp(delta);
        newScale = Math.max(0.5, Math.min(newScale, 10));
        return newScale;
      });
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      stage.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const handleSaveClick = () => {
    if (!imgRef.current) return;
    const imgW = imgRef.current.naturalWidth;
    const imgH = imgRef.current.naturalHeight;
    const scaleFactorDiag = Math.sqrt(imgW * imgW + imgH * imgH);

    const nosePt = points.find((p) => p.id === 1);
    if (!nosePt) return;

    const nosePxX = (nosePt.x / 100) * imgW;
    const nosePxY = (nosePt.y / 100) * imgH;

    let csvContent =
      "Landmark_MP_ID,Refined_X_Px,Refined_Y_Px,Normalized_X,Normalized_Y,Image_W,Image_H,Nose_X_Px,Nose_Y_Px\n";

    points.forEach((p) => {
      const pxX = (p.x / 100) * imgW;
      const pxY = (p.y / 100) * imgH;
      const normX = (pxX - nosePxX) / scaleFactorDiag;
      const normY = (pxY - nosePxY) / scaleFactorDiag;

      csvContent += `${p.id},${pxX.toFixed(2)},${pxY.toFixed(2)},${normX.toFixed(6)},${normY.toFixed(6)},${imgW},${imgH},${nosePxX.toFixed(2)},${nosePxY.toFixed(2)}\n`;
    });

    onSave(csvContent, points);
  };

  return (
    <div className="fixed inset-0 z-50 modal-overlay backdrop-blur-sm flex items-center justify-center p-6">
      <div
        className="landmark-modal-panel rounded-2xl flex flex-col w-full h-[90vh] overflow-hidden"
        aria-modal="true"
        role="dialog"
      >
        <div className="landmark-modal-header px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold landmark-modal-title">
              Mark Front Face Landmarks
            </h2>
            <p className="text-sm landmark-modal-subtitle">
              Drag the red points to outline the jawline, lips, and place the
              center point on the nose tip.
            </p>
          </div>
          <button
            onClick={onClose}
            className="landmark-modal-close p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={stageRef}
          className="landmark-modal-stage flex-1 overflow-hidden flex items-center justify-center p-8 select-none relative"
          onMouseDown={(e) => {
            // Start panning
            e.preventDefault();
            setDragState({
              type: "pan",
              startX: e.clientX,
              startY: e.clientY,
              startPanX: pan.x,
              startPanY: pan.y,
            });
          }}
        >
          {isDetecting && (
            <div className="absolute inset-0 z-20 modal-overlay backdrop-blur-sm flex flex-col items-center justify-center text-primary">
              <Loader2 className="w-12 h-12 animate-spin mb-4 brand-text" />
              <p className="font-medium text-xl mb-1">
                Auto-detecting landmarks...
              </p>
              <p className="text-sm text-secondary">Loading AI model</p>
            </div>
          )}

          {/* Container exactly wrapping the visual size of the image */}
          <div
            ref={containerRef}
            className={`relative inline-block shadow-2xl border border-primary ${isDetecting ? "opacity-0" : "opacity-100 transition-opacity duration-500"}`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "center center",
              cursor: dragState.type === "pan" ? "grabbing" : "grab",
            }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Front Face"
              onLoad={handleImageLoad}
              className="max-h-[70vh] w-full object-contain pointer-events-none block rounded-sm"
              draggable={false}
            />
            {points.map((p) => (
              <div
                key={p.id}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDragState({ type: "point", id: p.id });
                }}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.id === 1 ? `${markerSize + 2}px` : `${markerSize}px`,
                  height:
                    p.id === 1 ? `${markerSize + 2}px` : `${markerSize}px`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute rounded-full landmark-modal-marker border-[1.5px] shadow-md
                  ${p.id === 1 ? "landmark-modal-marker-nose z-10" : "landmark-modal-marker-face"} 
                  ${dragState.id === p.id ? "cursor-grabbing scale-125" : "cursor-pointer hover:scale-125"}
                  transition-transform duration-75`}
                title={p.id === 1 ? "Nose Tip" : `Point ${p.id}`}
              />
            ))}
          </div>
        </div>

        <div className="landmark-modal-footer px-6 py-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-secondary">
              Marker Size:
            </span>
            <input
              type="range"
              min="4"
              max="24"
              value={markerSize}
              onChange={(e) => setMarkerSize(Number(e.target.value))}
              className="w-32 cursor-pointer"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-secondary hover-bg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              className="px-6 py-2.5 rounded-xl font-medium btn-primary active:scale-95 transition-all flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save & Generate CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
