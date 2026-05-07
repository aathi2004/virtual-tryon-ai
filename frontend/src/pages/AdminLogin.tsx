import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[160px]" />
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-pink-500 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[160px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 pt-6 md:pt-8">
        <nav className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center font-black text-lg">
              V
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">VirtualFit Pro</p>
              <p className="text-xs text-white/60 leading-tight">
                AI Fitting Room · Admin Console
              </p>
            </div>
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm"
          >
            ← Back home
          </button>
        </nav>
      </div>

      <div className="relative flex items-center justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/80 mb-5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Admin Portal · Secure Access
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
            Manage the{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
              catalog.
            </span>
          </h1>
          <p className="mt-3 text-white/70">
            Sign in to upload, delete, and curate garments.
          </p>

          <form
            onSubmit={login}
            className="mt-8 rounded-2xl p-6 bg-white/5 backdrop-blur border border-white/10 shadow-2xl space-y-4"
          >
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
                Admin ID
              </label>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                type="text"
                placeholder="admin"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 focus:bg-white/15 transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
                Password
              </label>
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 focus:bg-white/15 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-90 text-white font-semibold shadow-xl shadow-indigo-500/30"
            >
              Login →
            </button>

            <p className="text-center text-xs text-white/40">
              Authorized admins only
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
