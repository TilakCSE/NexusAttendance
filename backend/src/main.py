from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

from ai.vision import AttendanceRecognizer
from core.database import init_db, add_user, get_known_faces

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the database on startup
init_db()

app = FastAPI(title="Nexus Spatial Attendance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize a global AI Brain so we can hot-reload its memory
recognizer = AttendanceRecognizer()
recognizer.load_memory(get_known_faces())

# Pydantic schema for the registration payload
class RegisterRequest(BaseModel):
    name: str
    embedding: list[float]

@app.post("/api/register")
async def register_user(req: RegisterRequest):
    """Saves the face to the DB and hot-reloads the AI memory."""
    add_user(req.name, req.embedding)
    
    # Instantly update the AI's memory without dropping the video stream
    recognizer.load_memory(get_known_faces())
    
    logger.info(f"Successfully registered Entity: {req.name}")
    return {"status": "success", "message": f"{req.name} registered securely."}

@app.websocket("/ws/stream")
async def video_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("Client connected to video stream.")
    
    try:
        # Use the global recognizer instance
        async for payload in recognizer.generate_frames():
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        logger.info("Client disconnected from video stream.")
    except Exception as e:
        logger.error(f"Stream error: {e}")