import { useNavigate } from "react-router-dom";

export default function GenderSelect() {
  const navigate = useNavigate();

  const select = (gender: string) => {
    localStorage.setItem("gender", gender);
    navigate("/size-analysis");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white relative overflow-hidden p-4 sm:p-6">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-indigo-500 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-pink-500 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <button
          onClick={() => navigate("/")}
          className="mb-5 sm:mb-6 text-sm text-white/70 hover:text-white"
        >
          ← Back home
        </button>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
          Select your category
        </h2>
        <p className="text-center text-sm sm:text-base text-white/60 mt-2">
          We'll tailor the garment catalog for you.
        </p>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <button
            onClick={() => select("men")}
            className="group aspect-[4/5] sm:aspect-[3/4] rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 hover:from-blue-500/40 hover:to-indigo-600/40 transition overflow-hidden relative"
          >
            <img
              src="/garments/jackets/men-suit.png"
              alt="Men"
              className="absolute inset-0 w-full h-full object-contain p-4 sm:p-6 group-hover:scale-105 transition"
            />
            <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent text-left">
              <p className="text-lg sm:text-xl font-bold">Men</p>
              <p className="text-xs text-white/60">
                Suits, jackets, shirts, tees
              </p>
            </div>
          </button>

          <button
            onClick={() => select("women")}
            className="group aspect-[4/5] sm:aspect-[3/4] rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-pink-500/20 to-purple-600/20 hover:from-pink-500/40 hover:to-purple-600/40 transition overflow-hidden relative"
          >
            <img
              src="/garments/jackets/women-suit.png"
              alt="Women"
              className="absolute inset-0 w-full h-full object-contain p-4 sm:p-6 group-hover:scale-105 transition"
            />
            <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent text-left">
              <p className="text-lg sm:text-xl font-bold">Women</p>
              <p className="text-xs text-white/60">
                Suits, blazers, shirts, tees
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
