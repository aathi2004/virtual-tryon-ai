import { useState } from "react";

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

export default function AdminUpload() {

  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const upload = async (e: any) => {
    e.preventDefault();

    const form = new FormData();

    const name = e.target.name.value;
    const category = e.target.category.value;
    const gender = e.target.gender.value;
    const image = e.target.image.files[0];

    if (!name || !category || !gender || !image) {
      alert("Please fill all fields");
      return;
    }

    form.append("name", name);
    form.append("category", category);
    form.append("gender", gender);
    form.append("image", image);

    try {

      setLoading(true);

      const res = await fetch(
        `${BACKEND}/api/garments/upload`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res.json();

      if (data.success) {

        alert("✅ Garment uploaded successfully");

        e.target.reset();
        setFileName("");

      } else {
        alert("❌ Upload failed");
      }

    } catch (error) {

      console.error(error);
      alert("❌ Upload failed");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-900">

      <div className="bg-white p-8 rounded-lg shadow-lg w-[420px]">

        <h2 className="text-xl font-semibold mb-6">
          Upload New Garment
        </h2>

        <form onSubmit={upload} className="space-y-4">

          {/* Garment Name */}
          <input
            name="name"
            placeholder="Garment Name"
            className="w-full border p-2 rounded"
          />

          {/* Category */}
          <select
            name="category"
            className="w-full border p-2 rounded"
          >
            <option value="">Select Category</option>
            <option value="shirt">Shirt</option>
            <option value="jacket">Jacket</option>
            <option value="dress">Dress</option>
          </select>

          {/* Gender */}
          <select
            name="gender"
            className="w-full border p-2 rounded"
          >
            <option value="">Select Gender</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>

          {/* Image Upload */}
          <div className="border p-3 rounded">

            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={(e: any) =>
                setFileName(e.target.files[0]?.name)
              }
            />

            {fileName && (
              <p className="text-sm mt-2 text-gray-600">
                {fileName}
              </p>
            )}

          </div>

          {/* Upload Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded"
          >

            {loading ? "Uploading..." : "Upload Garment"}

          </button>

        </form>

      </div>

    </div>
  );
} 