import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Landing from "./pages/Landing";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import UserEntry from "./pages/UserEntry";
import SizeAnalysis from "./pages/SizeAnalysis";
import SizeSelect from "./pages/SizeSelect";
import VirtualTryOn from "./pages/VirtualTryOn";

function App() {
  return (
    <Router>
      <Routes>

        {/* 🏠 Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* 👨‍💼 Admin Flow */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* 👤 User Flow */}
        <Route path="/user" element={<UserEntry />} />
        <Route path="/size-analysis" element={<SizeAnalysis />} />
        <Route path="/size-select" element={<SizeSelect />} />
        <Route path="/try-on" element={<VirtualTryOn />} />

        {/* ❌ 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <h2 className="text-2xl font-semibold">404 — Page Not Found</h2>
            </div>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;