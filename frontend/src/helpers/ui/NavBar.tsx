import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg surface-elevated hover-bg transition-colors"
      title={"Switch to " + (theme === "light" ? "dark" : "light") + " mode"}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-secondary" />
      ) : (
        <Sun className="w-5 h-5 text-info" />
      )}
    </button>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  const linkClass = (path: string) =>
    location.pathname === path
      ? "text-primary border-b-2 border-primary pb-1"
      : "hover:text-primary transition-colors pb-1";

  return (
    <>
      <Link
        to="/inference"
        className={linkClass("/inference")}
        onClick={onNavigate}
      >
        Inference
      </Link>
      <Link
        to="/inference-history"
        className={linkClass("/inference-history")}
        onClick={onNavigate}
      >
        History
      </Link>
      <Link
        to="/patients"
        className={linkClass("/patients")}
        onClick={onNavigate}
      >
        Patients
      </Link>
      <Link to="/about" className={linkClass("/about")} onClick={onNavigate}>
        About Us
      </Link>
    </>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar-bg border-b border-primary sticky top-0 z-20 w-full text-left">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={() => setIsOpen(false)}
        >
          <Activity className="w-6 h-6 brand-text" />
          <span className="text-xl font-bold tracking-tight text-primary">
            JawSight
          </span>
        </Link>

        <div className="flex items-center gap-3 lg:gap-8">
          <div className="hidden sm:flex gap-8 text-sm font-medium text-secondary">
            <NavLinks />
          </div>

          <ThemeToggle />

          <button
            type="button"
            className="inline-flex sm:hidden p-2 rounded-lg surface-elevated hover-bg transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? (
              <X className="w-5 h-5 text-secondary" />
            ) : (
              <Menu className="w-5 h-5 text-secondary" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden border-t border-primary">
          <div className="px-4 sm:px-6 py-4 flex flex-col gap-4 text-sm font-medium text-secondary">
            <NavLinks onNavigate={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
}
