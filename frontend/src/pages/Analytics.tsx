import { useEffect, useState } from "react";
import { getAnalytics } from "../services/api";

export default function Analytics() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getAnalytics().then(setData);
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Analytics Dashboard</h2>
      <p>Total Users: {data.totalUsers}</p>
      <p>Total Sessions: {data.totalSessions}</p>
      <p>Total TryOns: {data.totalTryOns}</p>
    </div>
  );
}