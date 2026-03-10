import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Size = "S" | "M" | "L" | "XL" | "XXL" | "XXXL";

interface Props {
  height?: number;      // cm
  shoulder?: number;    // cm
}

/* =========================
   🧠 AI SIZE ESTIMATION
========================= */
export function estimateSize(height: number, shoulder: number): Size {
  const score = height * 0.7 + shoulder * 0.3;

  if (score < 150) return "S";
  if (score < 160) return "M";
  if (score < 170) return "L";
  if (score < 180) return "XL";
  if (score < 190) return "XXL";
  return "XXXL";
}

/* =========================
   📄 PAGE COMPONENT
========================= */
export default function SizeAnalysis({ height = 172, shoulder = 44 }: Props) {
  const navigate = useNavigate();

  const [recommendedSize, setRecommendedSize] = useState<Size>("M");
  const [selectedSize, setSelectedSize] = useState<Size>("M");

  useEffect(() => {
    const size = estimateSize(height, shoulder);
    setRecommendedSize(size);
    setSelectedSize(size);
  }, [height, shoulder]);

  const sizes: Size[] = ["S", "M", "L", "XL", "XXL", "XXXL"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-[480px]">
        
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Body Size Analysis
        </h2>

        <p className="text-gray-600 text-center mb-8">
          AI Recommended Size Based on Body Proportions
        </p>

        {/* 🔹 Recommended Size */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center mb-8">
          <p className="text-gray-600">Recommended Size</p>
          <p className="text-4xl font-bold text-indigo-700 mt-2">
            {recommendedSize}
          </p>
        </div>

        {/* 🔹 Manual Size Selection */}
        <p className="text-gray-700 font-semibold mb-3 text-center">
          Choose Your Size
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`py-2 rounded-lg font-semibold border transition
                ${
                  selectedSize === size
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }
              `}
            >
              {size}
            </button>
          ))}
        </div>

        {/* 🔹 Continue Button */}
        <button
          onClick={() => navigate("/try-on")}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition"
        >
          Continue to Virtual Try-On
        </button>

      </div>
    </div>
  );
}