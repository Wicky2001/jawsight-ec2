import { useState, useEffect, useRef } from "react";
import {
  Info,
  CheckCircle,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { api } from "../../helpers/apiClient/apiClient";
import { dataURLtoFile } from "../../helpers/utils";
import { InfoCallout } from "../../helpers/ui/InfoCallout";
import LoadingSpinner from "../../helpers/ui/LoadingSpinner";
import { toastHelper } from "../../helpers/toastHelper";
import { InnerPageBody, InnerPageWrapper } from "../../helpers/ui/PageWrapper";
import { UploadZone } from "./UploadZone.tsx";
import { LandmarkModal } from "./LandmarkModal";
import { useSocket } from "../../context/SocketContext";
import PageHeader from "./InferencePageHeader";
import { fetchPatientDropdown } from "./Inference.service";

type InferencePhase = "idle" | "uploading" | "processing" | "completed";

const extractImageIdFromFileName = (fileName?: string | null) => {
  if (!fileName) return null;

  const cleanName = fileName.replace(/\.[^/.]+$/, "").trim();
  const match = cleanName.match(/^(FIN|RIN|LIN)_(.+)$/i);

  return match?.[2]?.trim() || null;
};

const Inference = () => {
  const [images, setImages] = useState<{
    left: string | null;
    right: string | null;
    front: string | null;
  }>({ left: null, right: null, front: null });
  const [csvData, setCsvData] = useState<string | null>(null);
  const [savedPointsArray, setSavedPointsArray] = useState<any[] | null>(null);
  const [uploadedFileNames, setUploadedFileNames] = useState<{
    left: string | null;
    right: string | null;
    front: string | null;
  }>({ left: null, right: null, front: null });
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  );
  const [dropDownData, setDropDownData] = useState<
    { name: string; id: number }[]
  >([]);

  const [showLandmarkModal, setShowLandmarkModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);
  const [phase, setPhase] = useState<InferencePhase>("idle");
  const processingTimeoutRef = useRef<number | null>(null);

  const { latestPrediction, clearPrediction } = useSocket();

  useEffect(() => {
    const loadDropdownData = async () => {
      setIsDropdownLoading(true);

      try {
        const result = await fetchPatientDropdown();
        setDropDownData(result.rows);
      } catch (error) {
        console.error("Failed to load patient dropdown data", error);
        toastHelper.error("Failed to load patient names.");
      } finally {
        setIsDropdownLoading(false);
      }
    };

    loadDropdownData();
  }, []);

  useEffect(() => {
    if (latestPrediction) {
      if (processingTimeoutRef.current) {
        window.clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }

      setIsProcessing(false);

      if (latestPrediction.status === "success") {
        const { data } = latestPrediction;

        setImages({ left: data.left, right: data.right, front: data.front });
        toastHelper.success("Inference completed successfully!");
        setPhase("completed");
      } else if (latestPrediction.status === "failed") {
        toastHelper.error(
          latestPrediction.message || "Inference failed. Please try again.",
        );
        setPhase("completed");
      } else {
        setPhase("idle");
      }

      clearPrediction();
    }
  }, [latestPrediction]);

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        window.clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const clearProcessingTimeout = () => {
    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  };

  const resetInference = () => {
    clearProcessingTimeout();
    setImages({ left: null, right: null, front: null });
    setUploadedFileNames({ left: null, right: null, front: null });
    setCsvData(null);
    setSavedPointsArray(null);
    setSelectedPatientId(null);
    setShowLandmarkModal(false);
    setIsSubmitting(false);
    setIsProcessing(false);
    setPhase("idle");
    clearPrediction();
  };

  const handleUpload = (
    id: "left" | "right" | "front",
    dataUrl: string,
    fileName?: string,
  ) => {
    setImages((prev) => ({ ...prev, [id]: dataUrl }));
    setUploadedFileNames((prev) => ({ ...prev, [id]: fileName || null }));
    if (id === "front") {
      setShowLandmarkModal(true);
    }
  };

  const handleRemove = (id: "left" | "right" | "front") => {
    setImages((prev) => ({ ...prev, [id]: null }));
    setUploadedFileNames((prev) => ({ ...prev, [id]: null }));
    if (id === "front") {
      setCsvData(null);
      setSavedPointsArray(null);
    }
  };

  const handleSaveLandmarks = (csvString: string, rawPoints: any[]) => {
    setCsvData(csvString);
    setSavedPointsArray(rawPoints);
    setShowLandmarkModal(false);
    toastHelper.success("Front landmarks saved successfully!");
  };

  const isReadyToSubmit =
    images.left &&
    images.right &&
    images.front &&
    csvData &&
    selectedPatientId !== null;

  const handleSubmit = async () => {
    if (!isReadyToSubmit || selectedPatientId === null) return;

    setIsSubmitting(true);
    setPhase("uploading");
    try {
      const imageId = [
        uploadedFileNames.left,
        uploadedFileNames.right,
        uploadedFileNames.front,
      ]
        .map((name) => extractImageIdFromFileName(name))
        .find(Boolean);

      const formData = new FormData();
      formData.append("patientId", String(selectedPatientId));
      if (imageId) {
        formData.append("image_id", imageId);
      }
      formData.append(
        "leftImage",
        dataURLtoFile(images.left as string, uploadedFileNames.left || "left"),
      );
      formData.append(
        "rightImage",
        dataURLtoFile(
          images.right as string,
          uploadedFileNames.right || "right",
        ),
      );
      formData.append(
        "frontImage",
        dataURLtoFile(
          images.front as string,
          uploadedFileNames.front || "front",
        ),
      );

      const csvBlob = new Blob([csvData as string], { type: "text/csv" });
      formData.append("frontCsv", csvBlob, "front.csv");

      await api.post("/inference", formData);

      toastHelper.success("PreOp Images successfully submitted!");
      setIsSubmitting(false);
      setIsProcessing(true);
      setPhase("processing");

      clearProcessingTimeout();
      processingTimeoutRef.current = window.setTimeout(
        () => {
          setIsSubmitting(false);
          setIsProcessing(false);
          setPhase("idle");
          toastHelper.error(
            "Inference is taking too long. Please try submitting again.",
          );
        },
        15 * 60 * 1000,
      );
    } catch (error: any) {
      console.error("Submission failed:", error);
      clearProcessingTimeout();
      toastHelper.error(
        error.response?.data?.message ||
          "Failed to submit data. Please try again.",
      );
      setIsSubmitting(false);
      setIsProcessing(false);
      setPhase("idle");
    }
  };

  return (
    <>
      {showLandmarkModal && (
        <LandmarkModal
          imageSrc={images.front as string}
          onSave={handleSaveLandmarks}
          onClose={() => setShowLandmarkModal(false)}
          existingPoints={savedPointsArray}
        />
      )}

      <InnerPageWrapper>
        <PageHeader
          selectedPatientId={selectedPatientId}
          setSelectedPatientId={setSelectedPatientId}
          dropDownData={dropDownData}
          isLoading={isDropdownLoading}
        />

        <InnerPageBody>
          <div className="w-full px-4 sm:px-6 py-6">
            {/* Mobile-first: stack columns then switch to row on md+ */}
            <div className="flex flex-col md:flex-row gap-6 mb-6 w-full">
              <div className="w-full md:w-1/2 flex flex-col">
                {/* Removed overflow-y-auto to stop inner scrolling. Added h-full to match the right card's height */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 shrink-0">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    1. Side Profiles
                  </h2>

                  {/* Responsive height: smaller on md screens, larger on lg+ */}
                  <div className="grid grid-cols-1 gap-6 mb-6 min-h-[240px] md:min-h-[280px] lg:min-h-[320px]">
                    <UploadZone
                      id="left"
                      title="Left Profile"
                      subtitle="90° lateral view"
                      imageDataUrl={images.left}
                      bgImage="/leftUploadPlaceHolder.png"
                      onUpload={handleUpload}
                      onRemove={handleRemove}
                      onError={(message: string) => toastHelper.error(message)}
                      showControls={phase !== "completed"}
                      showStatus={phase !== "completed"}
                    />
                    <UploadZone
                      id="right"
                      title="Right Profile"
                      subtitle="90° lateral view"
                      imageDataUrl={images.right}
                      bgImage="/rightUploadPlaceHolder.png"
                      onUpload={handleUpload}
                      onRemove={handleRemove}
                      onError={(message: string) => toastHelper.error(message)}
                      showControls={phase !== "completed"}
                      showStatus={phase !== "completed"}
                    />
                  </div>

                  {/* Added mt-auto to push callouts to the bottom evenly */}
                  <div className="space-y-3 shrink-0 mt-auto">
                    <InfoCallout
                      icon={AlertCircle}
                      title="Required Framing"
                      type="warning"
                    >
                      There must be a clear <strong>mid-side gap</strong>{" "}
                      between the tip of the chin and the edge of the image
                      border. Do not crop tightly around the jaw.
                    </InfoCallout>
                    <InfoCallout
                      icon={Info}
                      title="Optimization Tip"
                      type="info"
                    >
                      Using a solid green background (e.g., <code>#22FF33</code>
                      ) behind the patient dramatically improves silhouette edge
                      detection and model accuracy.
                    </InfoCallout>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col">
                {/* Removed overflow-y-auto. Added h-full */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 shrink-0">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    2. Front Profile
                  </h2>

                  <div className="flex-1 mb-6 min-h-[240px] md:min-h-[280px] lg:min-h-[320px]">
                    <UploadZone
                      id="front"
                      title="Front Face"
                      subtitle="Directly facing camera. No tilt."
                      imageDataUrl={images.front}
                      bgImage="/frontUploadPlaceHolder.png"
                      hasCsv={!!csvData}
                      onUpload={handleUpload}
                      onRemove={handleRemove}
                      onError={(message: string) => toastHelper.error(message)}
                      onEditMarks={() => setShowLandmarkModal(true)}
                      showControls={phase !== "completed"}
                      showStatus={phase !== "completed"}
                    />
                  </div>

                  <div className="shrink-0 mt-auto">
                    <InfoCallout
                      icon={CheckCircle}
                      title="Data Requirement"
                      type={csvData ? "success" : "warning"}
                    >
                      {csvData
                        ? "Landmark data (front.csv) has been successfully generated and attached to this profile."
                        : "After uploading the front face, you must mark the required facial landmarks to generate the front.csv file."}
                    </InfoCallout>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                {phase === "completed" ? (
                  <p className="text-emerald-600 font-medium text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Result images ready. Start a new inference when you are
                    ready.
                  </p>
                ) : isProcessing ? (
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Processing completed on the backend. Waiting for result
                    images.
                  </p>
                ) : isSubmitting ? (
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Uploading images and CSV to the server.
                  </p>
                ) : !isReadyToSubmit ? (
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Please upload all three images and mark front landmarks to
                    proceed.
                  </p>
                ) : (
                  <p className="text-emerald-600 font-medium text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    All images and front.csv ready for inference.
                  </p>
                )}
              </div>

              <button
                disabled={
                  phase !== "completed" &&
                  (!isReadyToSubmit || isSubmitting || isProcessing)
                }
                onClick={phase === "completed" ? resetInference : handleSubmit}
                className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-white transition-all duration-200 shadow-sm min-w-0 md:min-w-[220px] ${
                  phase === "completed"
                    ? "bg-teal-600 hover:bg-teal-700 hover:shadow-md active:scale-95 cursor-pointer"
                    : !isReadyToSubmit || isSubmitting || isProcessing
                      ? "bg-slate-300 cursor-not-allowed opacity-70"
                      : "bg-teal-600 hover:bg-teal-700 hover:shadow-md active:scale-95 cursor-pointer"
                }`}
              >
                {phase === "completed" ? (
                  "Submit another Inference"
                ) : isSubmitting ? (
                  <LoadingSpinner
                    label="Uploading..."
                    spinnerClassName="w-5 h-5"
                    labelClassName="text-white"
                  />
                ) : isProcessing ? (
                  <LoadingSpinner
                    label="Processing..."
                    spinnerClassName="w-5 h-5"
                    labelClassName="text-white"
                  />
                ) : (
                  "Submit for Inference"
                )}
              </button>
            </div>
          </div>
        </InnerPageBody>
      </InnerPageWrapper>
    </>
  );
};

export default Inference;
