import cv2
import base64
import asyncio
import time
import logging
import numpy as np
from insightface.app import FaceAnalysis
from core.database import mark_attendance, get_recent_logs

logger = logging.getLogger(__name__)

def sanitize_for_json(obj):
    if isinstance(obj, (np.integer, int)): return int(obj)
    elif isinstance(obj, (np.floating, float)): return float(obj)
    elif isinstance(obj, np.ndarray): return obj.tolist()
    elif isinstance(obj, list): return [sanitize_for_json(i) for i in obj]
    elif isinstance(obj, dict): return {k: sanitize_for_json(v) for k, v in obj.items()}
    return obj

class AttendanceRecognizer:
    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'], allowed_modules=['detection', 'recognition'])
        self.app.prepare(ctx_id=0, det_size=(224, 224)) 
        
        self.last_ai_faces = []
        self.is_processing = False
        self.known_faces = [] # AI's local memory banks

    def load_memory(self, db_faces):
        """Loads the database embeddings into the AI's RAM."""
        self.known_faces = db_faces
        logger.info(f"AI Memory Bank updated. Known identities: {len(self.known_faces)}")

    def _run_ai_sync(self, frame):
        try:
            faces = self.app.get(frame)
            detected = []
            for face in faces:
                if face.det_score < 0.6:
                    continue

                bbox = face.bbox.astype(int)
                emb = face.embedding.tolist() if face.embedding is not None else []
                
                # --- MEMORY MATCHING LOGIC ---
                identity = "Unregistered Entity"
                if self.known_faces and emb:
                    live_e = np.array(emb)
                    live_norm = np.linalg.norm(live_e)
                    
                    max_sim = -1
                    best_match = identity
                    
                    for k_face in self.known_faces:
                        k_e = np.array(k_face["embedding"])
                        k_norm = np.linalg.norm(k_e)
                        
                        # Cosine Similarity Formula
                        sim = np.dot(live_e, k_e) / (live_norm * k_norm)
                        
                        if sim > max_sim:
                            max_sim = sim
                            # If it is more than 40% confident it's the same person, match it!
                            if sim > 0.40: 
                                best_match = k_face["name"]
                                
                    identity = best_match
                # -----------------------------

                w = bbox[2] - bbox[0]
                pad = int(w * 0.15)
                
                detected.append({
                    "id": "unknown",
                    "name": identity,
                    "box": {
                        "left": max(0, bbox[0] - pad),
                        "top": max(0, bbox[1] - int(pad * 1.5)),
                        "right": min(frame.shape[1], bbox[2] + pad),
                        "bottom": min(frame.shape[0], bbox[3] + pad)
                    },
                    "embedding": emb
                })
            return detected
        except Exception as e:
            logger.error(f"AI Error: {e}")
            return []

    async def _process_frame_bg(self, frame):
        self.is_processing = True
        self.last_ai_faces = await asyncio.to_thread(self._run_ai_sync, frame)
        self.is_processing = False

    def _encode_frame(self, frame):
        _, buffer = cv2.imencode('.jpg', frame)
        return base64.b64encode(buffer).decode('utf-8')

    async def generate_frames(self):
        cap = cv2.VideoCapture(self.camera_index)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        if not cap.isOpened():
            yield {"error": "Could not open webcam."}
            return

        try:
           while True:
                ret, frame = await asyncio.to_thread(cap.read)
                if not ret:
                    await asyncio.sleep(0.05)
                    continue

                if not self.is_processing:
                    asyncio.create_task(self._process_frame_bg(frame.copy()))

                frame_b64 = await asyncio.to_thread(self._encode_frame, frame)

                # --- NEW ATTENDANCE LOGIC ---
                for face in self.last_ai_faces:
                    # If we know who this is, log them!
                    if face["name"] not in ["Unregistered Entity", "Scanning..."]:
                        # Fire and forget the database check so video doesn't lag
                        asyncio.create_task(asyncio.to_thread(mark_attendance, face["name"]))
                
                # Fetch the latest logs
                recent_logs = await asyncio.to_thread(get_recent_logs, 12)
                # -----------------------------

                payload = sanitize_for_json({
                    "frame": frame_b64,
                    "faces": self.last_ai_faces, 
                    "logs": recent_logs, # Add logs to the web stream
                    "timestamp": time.time()
                })

                yield payload
                await asyncio.sleep(0.033)
        finally:
            cap.release()