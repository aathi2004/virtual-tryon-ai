import { useNavigate } from "react-router-dom";

export default function GenderSelect() {
  const navigate = useNavigate();

  const select = (gender: string) => {
    localStorage.setItem("gender", gender);
    navigate("/size-analysis");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-6">Select Gender</h2>

        <div className="flex gap-6">
          <button
            className="bg-blue-500 text-white px-6 py-3 rounded"
            onClick={() => select("men")}
          >
            Men
          </button>

          <button
            className="bg-pink-500 text-white px-6 py-3 rounded"
            onClick={() => select("women")}
          >
            Women
          </button>
        </div>
      </div>
    </div>
  );
}