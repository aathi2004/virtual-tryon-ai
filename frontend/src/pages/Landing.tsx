import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 md:p-12 w-full max-w-md sm:max-w-lg text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
          VirtualFit <span className="text-indigo-600">Pro</span>
        </h1>

        <p className="text-sm sm:text-base text-gray-600 mb-8 sm:mb-10">
          AI-powered virtual try-on · real-time pose detection · smart size analysis
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
          <button
            onClick={() => navigate("/admin")}
            className="px-6 sm:px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition w-full sm:w-auto"
          >
            Admin Login
          </button>

          <button
            onClick={() => navigate("/user")}
            className="px-6 sm:px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg transition w-full sm:w-auto"
          >
            User Mode
          </button>
        </div>
      </div>
    </div>
  );
}
