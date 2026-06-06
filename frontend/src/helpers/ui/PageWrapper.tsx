import React from "react";

type PageWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Wrapper for content pages (Home, Login, Inference)
 * Provides scrolling when content exceeds viewport height
 */
export const PageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <div className="h-full w-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
};

export const PageContent = ({ children }: PageWrapperProps) => {
  return (
    <div className="w-full px-4 sm:px-6 py-6 flex flex-col flex-1 min-h-0">
      {children}
    </div>
  );
};

/**
 * Content wrapper for pages that need padding and max-width
 * Typically used inside PageWrapper
 */

export const InnerPageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <div className="h-full w-full bg-slate-50 flex flex-col overflow-hidden px-4 sm:px-6 py-6">
      {children}
    </div>
  );
};

export const InnerPageBody = ({ children }: PageWrapperProps) => {
  return <div className="flex flex-1 min-h-0 overflow-y-auto">{children}</div>;
};

/**

 * Header at top with scrollable table below
 */
export const TablePageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <div className="h-full w-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="w-full flex flex-col p-4 sm:p-6 overflow-hidden h-full min-h-0">
        {children}
      </div>
    </div>
  );
};

/**
 * Content wrapper for table page content (goes inside TablePageWrapper)
 * Makes only the table scroll while header stays fixed
 */
export const TableContentWrapper = ({ children }: PageWrapperProps) => {
  return (
    <div className="w-full overflow-y-auto mt-4 h-full flex-1 min-h-0">
      {children}
    </div>
  );
};
