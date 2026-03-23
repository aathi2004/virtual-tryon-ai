import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import GenderSelect from "./pages/GenderSelect";
import SizeAnalysis from "./pages/SizeAnalysis";
import SizeSelect from "./pages/SizeSelect";

import VirtualTryOn from "./pages/VirtualTryOn";

function App() {
  return (
    <Router>

      <Routes>

        {/* Landing */}
        <Route path="/" element={<Landing />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* User Flow */}
        <Route path="/user" element={<GenderSelect />} />
        <Route path="/size-analysis" element={<SizeAnalysis />} />
        <Route path="/size-select" element={<SizeSelect />} />

        {/* Try On */}
        <Route path="/try-on" element={<VirtualTryOn />} />

        {/* Fallback */}
        <Route
          path="*"
          element={<div style={{ padding: 40 }}>404 Page Not Found</div>}
        />

      </Routes>

    </Router>
  );
}

export default App;