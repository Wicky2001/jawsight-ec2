import { Calendar, Hash, Mail, User } from "lucide-react";
import type { PatientsDetailViewPatientInfoType } from "../../../../../shared/types/Patients/PatientsDetailView/PatientsDetailView.types";

interface PatientInfoCardProps {
  patient: PatientsDetailViewPatientInfoType;
}

const PatientInfoCard = ({ patient }: PatientInfoCardProps) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all hover:shadow-md gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center border border-teal-100 shrink-0">
          <User className="w-7 h-7 text-teal-600" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {patient.name}
          </h2>
          <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
            <Hash className="w-4 h-4" />
            <span className="font-medium text-slate-700">{patient.id}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 w-full sm:w-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shrink-0">
            <Calendar className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Age
            </p>
            <p className="text-slate-900 font-semibold">{patient.age}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shrink-0">
            <Mail className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Email
            </p>
            <p className="text-slate-900 font-semibold break-words max-w-[220px] sm:max-w-[320px]">
              {patient.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shrink-0">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Gender
            </p>
            <p className="text-slate-900 font-semibold">{patient.gender}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInfoCard;
