import { useEffect, useRef, useState } from "react";

type Garment = {
  _id: number;
  name: string;
  image: string;
};

const SizeAnalysis = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [size, setSize] = useState<string>("Calculating...");
  const [selectedSize, setSelectedSize] = useState<string>("XL");

  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);

  // 🎥 CAMERA
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

  // 👕 FETCH GARMENTS
  useEffect(() => {
    fetch("http://localhost:8000/api/garments")
      .then((res) => res.json())
      .then((data: Garment[]) => {
        setGarments(data);
      })
      .catch(() => {
        setGarments([
          { _id: 1, name: "Black Jacket", image: "black-jacket.png" },
          { _id: 2, name: "Blue Shirt", image: "blue-shirt.png" },
          { _id: 3, name: "Green Shirt", image: "green-shirt.png" },
        ]);
      });
  }, []);

  // 🧠 SIZE AUTO
  useEffect(() => {
    const timer = setTimeout(() => {
      setSize("XXXL");
      setSelectedSize("XXXL");
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const sizes = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"];
  // cSpell:ignore XXXL XXXXL

  // 🔥 SCALE MAP
  const getScale = () => {
    const map: Record<string, number> = {
      S: 0.5,
      M: 0.6,
      L: 0.7,
      XL: 0.8,
      XXL: 0.9,
      XXXL: 1.0,
      XXXXL: 1.1,
    };

    return map[selectedSize] || 0.8;
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* 🔥 LEFT - CAMERA */}
      <div
        style={{
          flex: 1,
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f5f5",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>AI Size Analysis</h2>

          <div style={{ position: "relative", display: "inline-block" }}>
            <video
              ref={videoRef}
              autoPlay
              style={{
                width: "720px",
                borderRadius: "15px",
                transform: "scaleX(-1)",
              }}
            />

            {/* 🔥 GARMENT OVERLAY */}
            {selectedGarment && (
              <img
                src={`http://localhost:8000/uploads/${selectedGarment}`}
                alt="garment"
                style={{
                  position: "absolute",
                  top: "68%",
                  left: "50%",
                  transform: `translate(-50%, -50%) scale(${getScale()})`,
                  width: "50%",
                  maxWidth: "380px",
                  mixBlendMode: "multiply", // 🔥 background remove effect
                  filter: "drop-shadow(0px 5px 10px rgba(0,0,0,0.3))",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {/* 🔥 SIZE PANEL */}
          <div
            style={{
              marginTop: 20,
              padding: 15,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              display: "inline-block",
            }}
          >
            <p><b>Recommended Size</b></p>
            <p style={{ color: "blue", fontSize: 18 }}>{size}</p>

            <p>Choose Size</p>

            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                style={{
                  margin: 5,
                  padding: "8px 12px",
                  background: selectedSize === s ? "#007bff" : "#ddd",
                  color: selectedSize === s ? "#fff" : "#000",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔥 RIGHT - GARMENTS SCROLL */}
      <div
        style={{
          width: "260px",
          height: "100vh",
          overflowY: "auto",
          borderLeft: "1px solid #ddd",
          padding: 10,
          background: "#fff",
        }}
      >
        <h3>Garments</h3>

        {garments.map((g) => (
          <div
            key={g._id}
            onClick={() => setSelectedGarment(g.image)}
            style={{
              border: "1px solid #ddd",
              padding: 10,
              marginBottom: 12,
              cursor: "pointer",
              textAlign: "center",
              borderRadius: 10,
              transition: "0.2s",
            }}
          >
            <img
              src={`http://localhost:8000/uploads/${g.image}`}
              alt={g.name}
              style={{ width: "100%" }}
            />
            <p>{g.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SizeAnalysis;