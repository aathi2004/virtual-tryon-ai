import { useEffect, useState } from "react";
import CameraFeed from "../components/CameraFeed";
import OutfitOverlay from "../components/OutfitOverlay";
import { getGarments } from "../services/api";

export default function TryOn() {
  const [pose, setPose] = useState<any>(null);
  const [garments, setGarments] = useState<any[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    getGarments().then(setGarments);
  }, []);

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="relative">
        <CameraFeed setPose={setPose} />
        {pose && selected && (
          <OutfitOverlay pose={pose} image={selected} />
        )}
      </div>

      <div className="mt-4 flex gap-4">
        {garments.map((g) => (
          <button
            key={g._id}
            onClick={() => setSelected(g.imageUrl)}
            className="bg-gray-700 px-3 py-2 rounded"
          >
            {g.name}
          </button>
        ))}
      </div>
    </div>
  );
}