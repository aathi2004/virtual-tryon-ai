import axios from "axios";

export const BACKEND_API =
  import.meta.env.VITE_BACKEND_URL ?? "https://virtualfitpro.onrender.com";
export const AI_API =
  import.meta.env.VITE_AI_API ?? BACKEND_API;

export const detectPose = async (image: string) => {
  const res = await axios.post(`${AI_API}/pose`, { image });
  return res.data;
};

export const getGarments = async () => {
  const res = await axios.get(`${BACKEND_API}/api/garments`);
  return res.data;
};

export const getAnalytics = async () => {
  const res = await axios.get(`${BACKEND_API}/api/analytics`);
  return res.data;
};
