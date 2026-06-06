import { Home, LifeBuoy, FileSearch } from "lucide-react";

const NotFound = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="mx-auto w-24 h-24 mb-8 brand-subtle rounded-[2rem] flex items-center justify-center rotate-3 border border-primary shadow-sm transition-transform hover:rotate-6 duration-300">
        <FileSearch
          className="w-10 h-10 brand-text -rotate-3"
          strokeWidth={1.5}
        />
      </div>

      <h1 className="text-6xl sm:text-7xl font-black text-primary mb-3 tracking-tighter">
        404
      </h1>
      <h2 className="text-2xl font-bold text-primary mb-4 tracking-tight">
        Page not found
      </h2>

      <p className="text-secondary text-center mb-10 text-base sm:text-lg leading-relaxed w-full mx-auto">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="/"
          className="w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] shadow-sm"
        >
          <Home className="w-5 h-5" />
          Go to Dashboard
        </a>

        <a
          href="mailto:support@jawsight.com"
          className="w-full sm:w-auto surface-elevated text-primary border border-primary hover-bg inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]"
        >
          <LifeBuoy className="w-5 h-5 text-muted" />
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default NotFound;
