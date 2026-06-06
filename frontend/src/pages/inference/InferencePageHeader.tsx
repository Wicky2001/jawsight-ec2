import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ScanEye } from "lucide-react";
import LoadingSpinner from "../../helpers/ui/LoadingSpinner";

type PageHeaderProps = {
  selectedPatientId: number | null;
  setSelectedPatientId: (id: number | null) => void;
  dropDownData: { name: string; id: number }[];
  isLoading?: boolean;
};

const PageHeader = ({
  selectedPatientId,
  setSelectedPatientId,
  dropDownData,
  isLoading = false,
}: PageHeaderProps) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all hover:shadow-md shrink-0">
      <div className="flex flex-row items-center gap-5">
        <div className="flex items-center justify-center shrink-0">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <ScanEye
              size={30}
              strokeWidth={2.5}
              style={{ color: "var(--brand-primary)" }}
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
            New Patient Inference
          </h1>
          <div className="text-slate-500 text-sm mt-1 font-medium leading-relaxed w-full">
            Upload side and front patient profiles to generate predictive
            mandibular outcomes.
          </div>
        </div>
      </div>
      <div className="w-full lg:w-[340px] shrink-0">
        <SelectPrimitive.Root
          value={selectedPatientId?.toString() ?? ""}
          onValueChange={(value) => {
            setSelectedPatientId(value ? Number(value) : null);
          }}
        >
          <SelectPrimitive.Trigger
            className={`w-full px-4 py-3.5 bg-white border text-sm rounded-xl flex justify-between items-center transition-colors shadow-inner focus:outline-none ${
              selectedPatientId === null
                ? "border-teal-400 text-slate-500"
                : "border-teal-600 text-slate-900"
            }`}
            style={{
              boxShadow:
                selectedPatientId === null
                  ? "none"
                  : "0 0 0 2px var(--brand-focus-ring)",
            }}
          >
            <SelectPrimitive.Value placeholder="Select Target Patient Profile..." />
            <SelectPrimitive.Icon>
              <ChevronDown size={18} className="text-slate-500" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={4}
              className="z-[10050] w-[var(--radix-select-trigger-width)] overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl"
            >
              <SelectPrimitive.Viewport className="p-1">
                {isLoading ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                    <LoadingSpinner
                      label="Loading patients..."
                      spinnerClassName="h-4 w-4"
                      labelClassName="text-slate-500"
                    />
                  </div>
                ) : dropDownData.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    No patients found
                  </div>
                ) : (
                  dropDownData.map((patient) => (
                    <SelectPrimitive.Item
                      key={patient.id}
                      value={patient.id.toString()}
                      className="relative flex items-center px-9 py-2.5 text-sm text-slate-700 outline-none rounded-lg cursor-pointer focus:bg-teal-50 focus:text-teal-700 data-[state=checked]:bg-teal-50 data-[state=checked]:text-teal-700 data-[state=checked]:font-medium transition-colors"
                    >
                      <SelectPrimitive.ItemIndicator className="absolute left-2.5 flex items-center justify-center text-teal-600">
                        <Check size={16} strokeWidth={3} />
                      </SelectPrimitive.ItemIndicator>
                      <SelectPrimitive.ItemText>
                        {patient.name}{" "}
                        <span className="text-slate-400 ml-1">
                          (ID: {patient.id})
                        </span>
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))
                )}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    </div>
  );
};

export default PageHeader;
