export type Garment = {
  id: string;
  name: string;
  src: string;
  category: "top" | "outer";
};

const common: Garment[] = [
  { id: "black-jacket", name: "Black Jacket", src: "/garments/jackets/black-jacket.png", category: "outer" },
  { id: "white-hoodie", name: "White Hoodie", src: "/garments/jackets/white-hoodie.png", category: "outer" },
  { id: "blue-shirt", name: "Blue Shirt", src: "/garments/shirts/blue-shirt.png", category: "top" },
  { id: "green-shirt", name: "Green Shirt", src: "/garments/shirts/green-shirt.png", category: "top" },
  { id: "red-shirt", name: "Red Shirt", src: "/garments/shirts/red-shirt.png", category: "top" },
];

export const menGarments: Garment[] = [
  { id: "men-suit", name: "Men's Suit", src: "/garments/jackets/men-suit.png", category: "outer" },
  ...common,
];

export const womenGarments: Garment[] = [
  { id: "women-suit", name: "Women's Suit", src: "/garments/jackets/women-suit.png", category: "outer" },
  ...common,
];

export const catalogFor = (gender: string): Garment[] =>
  gender === "women" ? womenGarments : menGarments;
