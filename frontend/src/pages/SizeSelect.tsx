import { useNavigate } from "react-router-dom";

const sizes = ["S", "M", "L", "XL", "XXL", "XXXL"];

export default function SizeSelect() {
  const navigate = useNavigate();

  const selectSize = (size: string) => {
    localStorage.setItem("size", size);
    navigate("/try-on");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-xl">

        <h2 className="text-xl font-bold mb-6">
          Choose Your Size
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {sizes.map((s) => (
            <button
              key={s}
              className="bg-indigo-500 text-white px-4 py-2 rounded"
              onClick={() => selectSize(s)}
            >
              {s}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}