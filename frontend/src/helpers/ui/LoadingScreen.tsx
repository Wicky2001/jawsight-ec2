import { Activity } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const LoadingScreen = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--color-bg-app)" }}
    >
      <div className="flex flex-col items-center w-full animate-in fade-in duration-700">
        {/* Animated Icon Container */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer expanding ring with brand glow */}
          <div
            className="absolute w-24 h-24 rounded-full animate-ping opacity-40 z-0"
            style={{ backgroundColor: "var(--brand-subtle-bg)" }}
          />
          {/* Middle pulsing aura/halo */}
          <div
            className="absolute w-20 h-20 rounded-full animate-pulse blur-md z-0"
            style={{ backgroundColor: "var(--brand-subtle-bg)" }}
          />
          {/* Inner dark circle lens with glowing edge and icon */}
          <div
            className="relative w-14 h-14 rounded-full border z-10 flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-surface-elevated)",
              borderColor: "var(--border-primary)",
              boxShadow: `0 0 15px var(--brand-primary)`,
            }}
          >
            <Activity
              className="w-7 h-7"
              style={{
                color: "var(--brand-primary)",
                filter: "drop-shadow(0 0 10px var(--brand-primary))",
              }}
            />
          </div>
        </div>
        {/* Text Content */}
        <h2
          className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2"
          style={{ color: "var(--brand-primary)" }}
        >
          JawSight
        </h2>
        <LoadingSpinner
          label="Loading session..."
          className="px-4 py-2 rounded-full shadow-sm backdrop-blur-sm"
          spinnerClassName="w-4 h-4 animate-spin"
          labelClassName="dim-glow"
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
