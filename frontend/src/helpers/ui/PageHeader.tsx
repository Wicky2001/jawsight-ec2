import type { LucideIcon } from "lucide-react";

export type PageHeaderProps = {
  Icon: LucideIcon;
  title: string;
  description: string;
  IconColor?: string;
};

const PageHeader = ({
  Icon,
  title,
  description,
  IconColor,
}: PageHeaderProps) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm flex items-center transition-all hover:shadow-md">
      <div className="flex flex-row w-full items-center">
        <div className="basis-1/4 sm:basis-1/6 flex items-center justify-center">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <Icon size={30} strokeWidth={2} color={IconColor || "#63A361"} />
          </div>
        </div>

        <div className="basis-3/4 sm:basis-5/6 pl-2' flex flex-col items-start justify-center">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          <div className="text-slate-500 text-sm mt-1 font-medium leading-relaxed w-full">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
