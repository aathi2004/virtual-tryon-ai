export default function AdminDashboard() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Upload Garment</h2>
          <input type="file" className="mb-4" />
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Upload
          </button>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Delete Garment</h2>
          <button className="bg-red-600 text-white px-4 py-2 rounded">
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
}