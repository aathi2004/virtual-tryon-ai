from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import base64
import cv2
import numpy as np
import mediapipe as mp

app = FastAPI(title="Virtual Outfit AI Service")

# -----------------------------
# Request Model
# -----------------------------
class ImageRequest(BaseModel):
    image: str


# -----------------------------
# Response Models
# -----------------------------
class Landmark(BaseModel):
    x: float
    y: float


class AIResponse(BaseModel):
    pose_landmarks: Optional[List[Landmark]] = []
    face_landmarks: Optional[List[Landmark]] = []


# -----------------------------
# Initialize MediaPipe (CPU Safe)
# -----------------------------
mp_pose = mp.solutions.pose
mp_face = mp.solutions.face_mesh


# -----------------------------
# Pose + Face Detection Endpoint
# -----------------------------
@app.post("/detect", response_model=AIResponse)
def detect(request: ImageRequest):

    if not request.image:
        raise HTTPException(status_code=400, detail="Image is empty")

    try:
        # Remove base64 header if exists
        if "," in request.image:
            image_data = request.image.split(",")[1]
        else:
            image_data = request.image

        # Decode base64
        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        pose_landmarks = []
        face_landmarks = []

        # ---- Pose Detection ----
        with mp_pose.Pose(
            static_image_mode=True,
            model_complexity=0,
            enable_segmentation=False,
            min_detection_confidence=0.5
        ) as pose:
            pose_results = pose.process(rgb)

            if pose_results.pose_landmarks:
                for lm in pose_results.pose_landmarks.landmark:
                    pose_landmarks.append({
                        "x": float(lm.x),
                        "y": float(lm.y)
                    })

        # ---- Face Detection ----
        with mp_face.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        ) as face:
            face_results = face.process(rgb)

            if face_results.multi_face_landmarks:
                for lm in face_results.multi_face_landmarks[0].landmark:
                    face_landmarks.append({
                        "x": float(lm.x),
                        "y": float(lm.y)
                    })

        return {
            "pose_landmarks": pose_landmarks,
            "face_landmarks": face_landmarks
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))