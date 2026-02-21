from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import mediapipe as mp

app = FastAPI()

# ✅ ENABLE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=True)

class ImageInput(BaseModel):
    image: str

@app.post("/pose")
async def detect_pose(data: ImageInput):
    try:
        image_data = base64.b64decode(data.image.split(",")[1])
        np_arr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        h, w, _ = img.shape

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if not results.pose_landmarks:
            return {"error": "No pose detected"}

        landmarks = results.pose_landmarks.landmark

        def get_point(index):
            return {
                "x": int(landmarks[index].x * w),
                "y": int(landmarks[index].y * h)
            }

        return {
            "left_shoulder": get_point(11),
            "right_shoulder": get_point(12),
            "left_hip": get_point(23),
            "right_hip": get_point(24)
        }

    except Exception as e:
        return {"error": str(e)}