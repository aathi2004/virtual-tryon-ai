import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

interface Garment {
  _id: string;
  name: string;
  category: string;
  gender: string;
  image: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [garments, setGarments] = useState<Garment[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGarments = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/garments`);
      const data = await res.json();
      setGarments(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unable to reach backend");
    }
  };

  useEffect(() => {
    loadGarments();
  }, []);

  const uploadGarment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !name || !category || !gender) {
      alert("Fill all fields and pick an image");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("gender", gender);
    formData.append("image", image);

    try {
      setUploading(true);
      const res = await fetch(`${BACKEND}/api/garments/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setName("");
        setCategory("");
        setGender("");
        setImage(null);
        loadGarments();
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteGarment = async (id: string) => {
    if (!confirm("Delete this garment?")) return;
    await fetch(`${BACKEND}/api/garments/${id}`, { method: "DELETE" });
    loadGarments();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white overflow-x-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[160px]" />
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-pink-500 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[160px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 pt-6 md:pt-8 pb-14">
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
                Admin Dashboard
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-90 text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/80">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Catalog · {garments.length} garment{garments.length === 1 ? "" : "s"}
          </div>

          <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight leading-[1.05]">
            Garment{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
              management.
            </span>
          </h1>

          <p className="mt-2 text-white/70">
            Upload new garments, or remove ones you no longer need.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
            Backend offline — {error}
          </div>
        )}

        <div className="mt-8 rounded-2xl p-6 bg-white/5 backdrop-blur border border-white/10 shadow-2xl">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-white/60 mb-4">
            Upload new garment
          </h3>
          <form
            onSubmit={uploadGarment}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 transition"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white focus:outline-none focus:border-indigo-400 transition"
            >
              <option value="" className="bg-slate-900">Category</option>
              <option value="shirt" className="bg-slate-900">Shirt</option>
              <option value="jacket" className="bg-slate-900">Jacket</option>
              <option value="dress" className="bg-slate-900">Dress</option>
              <option value="suit" className="bg-slate-900">Suit</option>
            </select>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white focus:outline-none focus:border-indigo-400 transition"
            >
              <option value="" className="bg-slate-900">Gender</option>
              <option value="men" className="bg-slate-900">Men</option>
              <option value="women" className="bg-slate-900">Women</option>
              <option value="unisex" className="bg-slate-900">Unisex</option>
            </select>
            <label className="px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white/80 cursor-pointer flex items-center justify-between text-sm truncate">
              <span className="truncate">
                {image ? image.name : "Choose image"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <button
              type="submit"
              disabled={uploading}
              className="py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-90 text-white font-semibold disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload →"}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl p-6 bg-white/5 backdrop-blur border border-white/10 shadow-2xl">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-white/60 mb-4">
            Uploaded garments
          </h3>

          {garments.length === 0 ? (
            <p className="text-white/50 py-10 text-center">
              No garments uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {garments.map((g) => (
                <div
                  key={g._id}
                  className="rounded-xl bg-white/10 border border-white/10 p-3 hover:border-white/25 transition"
                >
                  <div className="aspect-square rounded-lg bg-white p-2 flex items-center justify-center">
                    <img
                      src={`${BACKEND}/uploads/${g.image}`}
                      alt={g.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold truncate">{g.name}</p>
                    <p className="text-xs text-white/50">
                      {g.category || "—"} · {g.gender || "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteGarment(g._id)}
                    className="mt-3 w-full py-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-200 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
