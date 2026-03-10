import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      
      <div className="bg-white rounded-3xl shadow-2xl p-12 w-[520px] text-center">
        
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Virtual Try-On System
        </h1>

        <p className="text-gray-600 mb-10">
          AI Powered 360° Garment Experience
        </p>

        <div className="flex gap-6 justify-center">
          <button
            onClick={() => navigate("/admin")}
            className="px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition"
          >
            Admin Login
          </button>

          <button
            onClick={() => navigate("/user")}
            className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg transition"
          >
            User Mode
          </button>
        </div>

      </div>
    </div>
  );
}