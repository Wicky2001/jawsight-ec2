import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type NoDataFoundBannerProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

const NoDataFoundBanner = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
  compact = false,
}: NoDataFoundBannerProps) => {
  return (
    <div
      className={`flex flex-col w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center text-slate-500 ${compact ? "py-6" : "py-16"} ${className}`}
    >
      <Icon
        className={`${compact ? "h-10 w-10" : "h-12 w-12"} text-slate-300`}
      />
      <h3
        className={`${compact ? "text-base" : "text-lg"} font-semibold text-slate-700`}
      >
        {title}
      </h3>
      <p
        className={`${compact ? "w-full text-xs" : "w-full text-sm"} leading-relaxed text-slate-500`}
      >
        {description}
      </p>
      {action ? <div className="pt-3">{action}</div> : null}
    </div>
  );
};

export default NoDataFoundBanner;
