import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-[420px]">
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Admin Portal
        </h2>

        <p className="text-gray-600 mb-8 text-center">
          Virtual Try-On Management
        </p>

        <div className="space-y-5">
          <input
            type="text"
            placeholder="Admin ID"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <button
            onClick={() => navigate("/admin/dashboard")}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition"
          >
            Login
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Authorized Admins Only
        </p>

      </div>
    </div>
  );
}