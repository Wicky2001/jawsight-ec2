import {
  GraduationCap,
  Stethoscope,
  BrainCircuit,
  Code2,
  Info,
  Mail,
} from "lucide-react";
import { PageWrapper } from "../../helpers/ui/PageWrapper";
import rasikaImage from "../../assets/team/rasika-rajapaksha.jpg";
import indikaImage from "../../assets/team/indika-kulathunga.jpg";
import gayanthaImage from "../../assets/team/gayantha-kodagoda.jpg";
import pasinduImage from "../../assets/team/pasindu-wickramaratna.jpg";

type Contributor = {
  name: string;
  role: string;
  affiliation: string[];
  image: string;
  icon: typeof GraduationCap;
};

const CONTRIBUTORS: Contributor[] = [
  {
    name: "Pasindu Wickramaratna",
    role: "Undergraduate Researcher & Developer",
    affiliation: [
      "Department of Computer Systems Engineering",
      "University of Kelaniya",
    ],
    image: pasinduImage,
    icon: Code2,
  },
  {
    name: "Dr. Rasika Rajapaksha",
    role: "Senior Lecturer (Grade II)",
    affiliation: [
      "Department of Computer Systems Engineering",
      "University of Kelaniya",
    ],
    image: rasikaImage,
    icon: GraduationCap,
  },
  {
    name: "Dr. Indika Kulathunga",
    role: "Oral and Maxillofacial Surgeon",
    affiliation: ["Clinical Advisor"],
    image: indikaImage,
    icon: Stethoscope,
  },
  {
    name: "Dr. Gayantha Kodagoda",
    role: "Department of Graduate Studies",
    affiliation: ["University of Sri Jayewardenepura"],
    image: gayanthaImage,
    icon: GraduationCap,
  },
];

const About = () => {
  return (
    <PageWrapper>
      <div className="min-h-full bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
        <main className="pb-16">
          {/* Intro */}
          <section className="w-full px-6 pt-12 pb-14 lg:pt-16 text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-teal-600 mb-4">
              ABOUT US
            </p>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
              The people behind{" "}
              <span className="text-teal-600">JawSight</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
              JawSight is a final-year research project that predicts the
              post-operative jaw shape of patients with mandibular
              retrognathia and prognathism. It brings together clinical
              expertise in oral and maxillofacial surgery with deep learning
              and cloud engineering.
            </p>
          </section>

          {/* Contributors */}
          <section className="py-16 bg-white border-y border-slate-200">
            <div className="w-full px-6">
              <div className="text-center mb-14">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Contributors
                </h2>
                <p className="text-slate-500 text-lg">
                  Research, supervision and clinical guidance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                {CONTRIBUTORS.map((person) => (
                  <article
                    key={person.name}
                    className="group bg-slate-50 rounded-3xl border border-slate-200 p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:border-teal-200"
                  >
                    <div className="relative mb-6">
                      <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-br from-teal-500 to-teal-200">
                        <img
                          src={person.image}
                          alt={person.name}
                          loading="lazy"
                          className="w-full h-full rounded-full object-cover object-top border-4 border-white"
                        />
                      </div>
                      <span className="absolute bottom-1 right-1 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-teal-600">
                        <person.icon className="w-5 h-5" />
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {person.name}
                    </h3>
                    <p className="text-teal-700 font-semibold mb-3">
                      {person.role}
                    </p>
                    <div className="space-y-1">
                      {person.affiliation.map((line) => (
                        <p key={line} className="text-slate-500 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Project notes */}
          <section className="py-16 w-full px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 text-teal-600">
                  <BrainCircuit className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Our Research
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  From left, right and front patient profiles, JawSight maps
                  facial landmarks and predicts the post-operative jaw contour.
                  The predicted contour is then used to render a visual preview
                  of the expected facial outcome, helping clinicians discuss
                  surgical planning with patients.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
                  <Info className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Important Note
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Result images are computer-generated simulations produced for
                  research and planning discussion. They are visual estimates,
                  not guaranteed clinical outcomes, and they do not replace
                  professional surgical assessment.
                </p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <p className="text-slate-500 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 text-teal-600" />
                For research collaborations, please contact the Department of
                Computer Systems Engineering, University of Kelaniya.
              </p>
            </div>
          </section>
        </main>
      </div>
    </PageWrapper>
  );
};

export default About;
