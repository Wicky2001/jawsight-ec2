import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  ScanFace,
  LineChart,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageWrapper } from "../../helpers/ui/PageWrapper";

const Home = () => {
  return (
    <PageWrapper>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden relative">
        <main className="pb-16">
          {/* Hero Section */}
          <section className="relative w-full px-6 pt-12 pb-24 lg:pt-20 lg:pb-32 flex flex-col lg:flex-row items-center gap-12 z-10">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                Predictive Surgical <br className="hidden lg:block" />
                Outcomes with{" "}
                <span className="text-teal-600">Precision AI</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-500 mb-8 w-full mx-auto lg:mx-0">
                Empower your orthognathic planning. Upload patient profiles, map
                clinical landmarks, and generate highly accurate post-operative
                mandibular predictions in seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/inference"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-teal-700 transition-all active:scale-95"
                >
                  Start Inference
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Hero Visual - Minimalist UI Representation */}
            <div className="flex-1 w-full relative">
              <div className="relative bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="bg-slate-900 rounded-[2rem] overflow-hidden p-6 aspect-[4/3] flex flex-col justify-between relative border border-slate-800">
                  <div className="flex justify-between items-center text-slate-400 mb-4 z-10">
                    <div className="flex items-center gap-2">
                      <ScanFace className="w-5 h-5 text-teal-600" />
                    </div>
                  </div>

                  {/* Minimal face tracking dots */}
                  <div
                    className="w-full h-full rounded-[1.75rem] bg-center bg-cover bg-no-repeat"
                    style={{ backgroundImage: "url('/home_page.png')" }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section
            id="features"
            className="py-20 bg-white border-y border-slate-200"
          >
            <div className="w-full px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Built for Clinical Excellence
                </h2>
                <p className="text-slate-500 w-full mx-auto text-lg">
                  Our inference engine combines cutting-edge computer vision
                  with medical-grade security.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: BrainCircuit,
                    title: "Advanced Deep Learning",
                    desc: "Utilizes multi-angle spatial awareness to predict complex soft-tissue and skeletal changes accurately.",
                  },
                  {
                    icon: ScanFace,
                    title: "Smart Landmark Detection",
                    desc: "Auto-detects crucial facial landmarks with an interactive editor for pinpoint manual adjustments.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "AWS Secure Storage",
                    desc: "We securely store your patients' images. Data at rest is encrypted. Only you can access your data. Since we use AWS, your data is secure and highly available.",
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 p-8 rounded-3xl border border-slate-200 transition-all duration-300"
                  >
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 text-teal-600">
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How it Works */}
          <section id="how-it-works" className="py-24 w-full px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Seamless Workflow
              </h2>
              <p className="text-slate-500 w-full mx-auto text-lg">
                From upload to prediction in three simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-[16.66%] right-[16.66%] h-[1px] bg-slate-200 -z-10 -translate-y-1/2"></div>

              {[
                {
                  step: 1,
                  icon: UploadCloud,
                  title: "Upload Profiles",
                  desc: "Securely upload standard 90° lateral and frontal patient photographs.",
                },
                {
                  step: 2,
                  icon: Edit3,
                  title: "Verify Landmarks",
                  desc: "Our AI auto-places critical tracking points. You make the final micro-adjustments.",
                },
                {
                  step: 3,
                  icon: LineChart,
                  title: "Generate Prediction",
                  desc: "Receive immediate visual inferences for mandibular positioning outcomes.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center bg-white p-8 rounded-3xl border border-slate-200 relative"
                >
                  <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 absolute -top-5">
                    {item.step}
                  </div>
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 mt-2 text-slate-900 transition-colors">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Minimal Footer */}
        <footer className="bg-slate-50 py-12 border-t border-slate-200">
          <div className="w-full px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-slate-900">
              <Activity className="w-5 h-5 text-teal-600" />
              <span className="text-lg font-bold tracking-tight">JawSight</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-teal-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-teal-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-teal-600 transition-colors">
                Contact Support
              </a>
            </div>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} JawSight AI. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </PageWrapper>
  );
};

// Temporary fallback for icons missing from top import in actual lucide-react versions
function Edit3(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
  );
}

export default Home;
