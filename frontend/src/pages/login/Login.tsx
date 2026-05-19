import { Activity, ShieldCheck, ArrowRight } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { PageWrapper } from "../../helpers/ui/PageWrapper";

// --- SVG Icons for OAuth Providers ---

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

// --- Main Component ---

const Login = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from =
    location.state?.from?.pathname || searchParams.get("from") || "/";
  const BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}/auth/google?from=${encodeURIComponent(from)}`;
  };

  return (
    <PageWrapper className="flex items-center justify-center">
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 relative group">
              <div className="absolute inset-0 bg-teal-100 rounded-2xl animate-ping opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Activity className="w-8 h-8 text-teal-600 relative z-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Welcome to JawSight
            </h1>
            <p className="text-slate-500 text-lg px-4">
              Sign in to access your secure AI inference dashboard and patient
              records.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
            <div className="space-y-4">
              {/* Active Google Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-between bg-white border-2 border-slate-200 text-slate-700 py-3.5 px-5 rounded-2xl font-semibold hover:bg-slate-50 hover:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition-colors transform group-hover:translate-x-1" />
              </button>

              {/* Divider */}
              <div className="flex items-center py-2">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">
                  Other options
                </span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              {/* Disabled GitHub Button */}
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 bg-slate-50 border border-slate-200/60 text-slate-400 py-3.5 px-5 rounded-2xl font-medium cursor-not-allowed opacity-60"
              >
                <GithubIcon />
                Continue with GitHub
              </button>

              {/* Disabled Facebook Button */}
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 bg-slate-50 border border-slate-200/60 text-slate-400 py-3.5 px-5 rounded-2xl font-medium cursor-not-allowed opacity-60"
              >
                <FacebookIcon />
                Continue with Facebook
              </button>
            </div>

            {/* Security Note */}
            <div className="mt-8 flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                JawSight uses secure, passwordless authentication. We never
                store your passwords. By logging in, you agree to our{" "}
                <a
                  href="#"
                  className="text-teal-600 font-medium hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-teal-600 font-medium hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Login;
