import { useEffect, useCallback, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ShieldAlert, RefreshCw } from "lucide-react";
import {
  InnerPageWrapper,
  InnerPageBody,
} from "../../../helpers/ui/PageWrapper";
import NoDataFoundBanner from "../../../helpers/ui/NoDataFoundBanner";
import LoadingSpinner from "../../../helpers/ui/LoadingSpinner";
import { api } from "../../../helpers/apiClient/apiClient";
import { toastHelper } from "../../../helpers/toastHelper";
import ImageCard from "../../../helpers/ui/ImageCard.tsx";
import PatientInfoCard from "./PatientInfoCard";
import type {
  PatientsDetailViewPatientInfoType,
  PatientsDetailViewRequestType,
  PatientsDetailViewResponseType,
  PatientsIterationDetailsType,
} from "../../../../../shared/types/Patients/PatientsDetailView/PatientsDetailView.types";

type PatientsDetailLocationState = {
  patient: PatientsDetailViewPatientInfoType;
};

const PATIENT_DETAIL_VIEW_API_URL = "/patients/detail-view";

const PatientsDetailView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { patient } = (location.state as PatientsDetailLocationState) ?? {};

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [detailsData, setDetailsData] =
    useState<PatientsDetailViewResponseType | null>(null);

  const cancelPendingRequest = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const getPatientDetails = useCallback(
    async ({ id }: PatientsDetailViewRequestType) => {
      const requestId = ++requestIdRef.current;

      try {
        cancelPendingRequest();
        setLoading(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await api.get(
          PATIENT_DETAIL_VIEW_API_URL,
          { id },
          { signal: controller.signal },
        );

        if (requestId !== requestIdRef.current) {
          return;
        }

        const nextDetails = response.data as PatientsDetailViewResponseType;
        setDetailsData(nextDetails);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        console.error("Failed to fetch patient detail view", error);
        toastHelper.error("Failed to load patient details. Please try again.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRegenerating(false);
        }
      }
    },
    [cancelPendingRequest],
  );

  useEffect(() => {
    if (!patient) {
      toastHelper.error(
        "Patient data not found. Please select a patient from the list.",
      );
      return;
    }

    getPatientDetails({ id: patient.id });

    return () => {
      cancelPendingRequest();
    };
  }, [getPatientDetails, patient, cancelPendingRequest, refreshTrigger]);

  const handleRegenerateUrls = () => {
    setRegenerating(true);
    setRefreshTrigger((prev) => prev + 1);
    toastHelper.warning(
      "Secure image URLs are being regenerated for another 30 minutes.",
    );
  };

  if (!patient) {
    return (
      <InnerPageWrapper>
        <NoDataFoundBanner
          icon={AlertCircle}
          title="Patient data not found"
          description="Please open this page from the patient directory so the selected patient can be loaded from the backend."
          action={
            <button
              onClick={() => navigate(-1)}
              className="text-teal-600 font-medium hover:underline"
            >
              Go Back
            </button>
          }
        />
      </InnerPageWrapper>
    );
  }

  return (
    <InnerPageWrapper>
      <PatientInfoCard patient={patient} />
      <InnerPageBody>
        {loading && !detailsData ? (
          <LoadingSpinner
            centered
            label="Loading patient results..."
            className="flex-1 py-12"
            spinnerClassName="w-10 h-10"
            labelClassName="text-slate-600"
          />
        ) : detailsData?.iteration_details &&
          detailsData.iteration_details.length > 0 ? (
          <div className="flex flex-col gap-12 pb-10 w-full">
            {detailsData.iteration_details.map(
              (iteration: PatientsIterationDetailsType, index: number) => (
                <div
                  key={iteration.iteration_code || index}
                  className="flex flex-col gap-6"
                >
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                    <span className="bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-full text-sm">
                      #{index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">
                      Iteration:{" "}
                      <span className="font-medium text-slate-600">
                        {iteration.iteration_code}
                      </span>
                    </h3>
                  </div>

                  <div className="flex flex-col md:flex-row justify-around gap-3 lg:gap-2 xl:gap-8 w-full h-full">
                    <ImageCard
                      title="Left Profile"
                      url={iteration.left_sign_image_url}
                    />
                    <ImageCard
                      title="Front Face"
                      url={iteration.front_sign_image_url}
                    />
                    <ImageCard
                      title="Right Profile"
                      url={iteration.right_sign_image_url}
                    />
                  </div>
                </div>
              ),
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between transition-all mt-4">
              <div className="flex gap-4 items-start">
                <ShieldAlert className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-lg mb-1">
                    Temporary Secure Access
                  </h4>
                  <p className="text-amber-800 text-sm leading-relaxed w-full">
                    <strong>Note:</strong> We apply extra security steps to
                    protect patient privacy, hence these images are only
                    available for <strong>30 minutes</strong>. If the images
                    disappear or fail to load, please click the button below to
                    generate new secure access URLs for another 30 minutes.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRegenerateUrls}
                disabled={regenerating || loading}
                className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm
                    ${
                      regenerating || loading
                        ? "bg-amber-200 text-amber-700 cursor-not-allowed"
                        : "bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-100 hover:shadow-md active:scale-95"
                    }`}
              >
                <RefreshCw
                  className={`w-5 h-5 ${regenerating ? "animate-spin" : ""}`}
                />
                {regenerating ? "Generating URLs..." : "Regenerate Image URLs"}
              </button>
            </div>
          </div>
        ) : (
          <NoDataFoundBanner
            icon={AlertCircle}
            title="No patient results found"
            description="The backend did not return any iteration details for this patient yet."
          />
        )}
      </InnerPageBody>
    </InnerPageWrapper>
  );
};

export default PatientsDetailView;
