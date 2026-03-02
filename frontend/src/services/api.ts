import axios from "axios";

export const AI_API = "http://localhost:8000";
export const BACKEND_API = "http://localhost:5000";

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