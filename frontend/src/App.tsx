import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Inference from "./pages/inference/Inference";
import InferenceHistory from "./pages/inferenceHistory/InferenceHistory";
import InferenceHistoryDetailView from "./pages/inferenceHistory/inferenceHistoryDetailView/InferenceHistoryDetailView";
import Patients from "./pages/patients/Patients";
import PatientsDetailView from "./pages/patients/PatientsDetailView/PatientsDetailView";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import Login from "./pages/login/Login";
import NotFound from "./pages/notfound/NotFound";
import ProtectedRoute from "./helpers/ProtectedRoute";
import Navbar from "./helpers/ui/NavBar";

import "./App.css";

function App() {
  return (
    <div className="h-screen flex flex-col bg-app font-sans text-primary">
      <Navbar />

      <main className="flex-1 min-h-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/inference" element={<Inference />} />
            <Route path="/inference-history" element={<InferenceHistory />} />
            <Route
              path="/inference-history-detail-view/:patient_id/:patient_name/:inference_id"
              element={<InferenceHistoryDetailView />}
            />
            <Route
              path="/patients-detail-view"
              element={<PatientsDetailView />}
            />
            <Route path="/patients" element={<Patients />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        newestOnTop
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default App;
