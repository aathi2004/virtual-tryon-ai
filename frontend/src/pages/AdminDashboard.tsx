import { useEffect, useState } from "react";

export default function AdminDashboard() {

  const [garments, setGarments] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [image, setImage] = useState<File | null>(null);

  /* =========================
     LOAD GARMENTS
  ========================= */

  const loadGarments = async () => {

    const res = await fetch("http://localhost:8000/api/garments");
    const data = await res.json();

    setGarments(data);

  };

  useEffect(() => {
    loadGarments();
  }, []);

  /* =========================
     UPLOAD GARMENT
  ========================= */

  const uploadGarment = async (e: any) => {

    e.preventDefault();

    if (!image) {
      alert("Select image");
      return;
    }

    const formData = new FormData();

    formData.append("name", name);
    formData.append("category", category);
    formData.append("gender", gender);
    formData.append("image", image);

    const res = await fetch(
      "http://localhost:8000/api/garments/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (data.success) {

      alert("Garment uploaded");

      setName("");
      setCategory("");
      setGender("");
      setImage(null);

      loadGarments();

    } else {

      alert("Upload failed");

    }

  };

  /* =========================
     DELETE GARMENT
  ========================= */

  const deleteGarment = async (id: string) => {

    await fetch(
      `http://localhost:8000/api/garments/${id}`,
      {
        method: "DELETE",
      }
    );

    loadGarments();

  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-700 p-10">

      <h1 className="text-white text-2xl font-bold mb-6 text-center">
         Admin Garment Management
      </h1>

      {/* =========================
         UPLOAD FORM
      ========================= */}

      <div className="bg-white rounded-lg p-6 mb-8 max-w-4xl mx-auto">

        <h2 className="font-semibold mb-4">
          Upload New Garment
        </h2>

        <form
          onSubmit={uploadGarment}
          className="grid grid-cols-5 gap-4"
        >

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Garment Name"
            className="border p-2 rounded"
          />

          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (shirt/jacket)"
            className="border p-2 rounded"
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Gender</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>

          <input
            type="file"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />

          <button
            className="bg-indigo-600 text-white rounded px-4"
          >
            Upload
          </button>

        </form>

      </div>

      {/* =========================
         GARMENT LIST
      ========================= */}

      <div className="bg-white rounded-lg p-6">

        <h2 className="text-lg font-semibold mb-4">
          Uploaded Garments
        </h2>

        {garments.length === 0 && (
          <p>No garments uploaded yet.</p>
        )}

        <div className="grid grid-cols-3 gap-6">

          {garments.map((g) => (

            <div
              key={g._id}
              className="border rounded p-4 text-center"
            >

              <img
                src={`http://localhost:8000/uploads/${g.image}`}
                alt={g.name}
                className="w-full h-40 object-contain mb-3"
              />

              <h3 className="font-semibold">
                {g.name}
              </h3>

              <p className="text-sm text-gray-500">
                {g.category} | {g.gender}
              </p>

              <button
                onClick={() => deleteGarment(g._id)}
                className="mt-3 bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}