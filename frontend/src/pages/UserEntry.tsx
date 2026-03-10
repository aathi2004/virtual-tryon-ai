import { useNavigate } from "react-router-dom";

export default function UserEntry() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      
      <div className="bg-white rounded-3xl shadow-2xl p-12 w-[520px] text-center">
        <h1 className="text-3xl font-bold mb-3">Welcome</h1>
        <p className="text-gray-600 mb-10">Choose your category</p>

        <div className="flex gap-8 justify-center">
          <button
            onClick={() => navigate("/size-analysis?gender=men")}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"
          >
            Men
          </button>

          <button
            onClick={() => navigate("/size-analysis?gender=women")}
            className="px-10 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-lg"
          >
            Women
          </button>
        </div>
      </div>
    </div>
  );
}