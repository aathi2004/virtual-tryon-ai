import React from "react";

interface Props {
  onSelect: (texture: string) => void;
}

const garments = [
  {
    name: "Blue Shirt",
    image: "/assets/blue-shirt.png",
  },
  {
    name: "Red Shirt",
    image: "/assets/red-shirt.png",
  },
  {
    name: "Green Shirt",
    image: "/assets/green-shirt.png",
  },
  {
    name: "Black Jacket",
    image: "/assets/black-jacket.png",
  },
];

const GarmentsList: React.FC<Props> = ({ onSelect }) => {
  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Garments</h2>

      {garments.map((item, index) => (
        <div
          key={index}
          onClick={() => onSelect(item.image)}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            cursor: "pointer",
            borderRadius: 8,
            transition: "0.2s",
          }}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
};

export default GarmentsList;