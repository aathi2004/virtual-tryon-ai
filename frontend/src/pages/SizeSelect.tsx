import { useNavigate, useSearchParams } from "react-router-dom";

const sizes = ["S","M","L","XL","XXL","XXXL"];

export default function SizeSelect() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const recommended = params.get("size") || "M";
  const gender = params.get("gender");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      
      <div className="bg-white rounded-3xl shadow-2xl p-12 w-[520px] text-center">
        <h2 className="text-2xl font-bold mb-2">Your Perfect Fit</h2>
        <p className="text-gray-600 mb-6">
          Recommended Size: 
          <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
            {recommended}
          </span>
        </p>

        <p className="text-gray-500 mb-4">Or choose manually</p>

        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {sizes.map(size => (
            <button
              key={size}
              onClick={() => navigate(`/try-on?gender=${gender}&size=${size}`)}
              className={`px-4 py-2 rounded-lg border ${
                size === recommended
                  ? "bg-green-600 text-white border-green-600"
                  : "hover:bg-gray-100"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate(`/try-on?gender=${gender}&size=${recommended}`)}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg"
        >
          Continue with Recommended
        </button>
      </div>
    </div>
  );
}