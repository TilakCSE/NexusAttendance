from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import csv
from fastapi.responses import FileResponse

from ai.vision import AttendanceRecognizer
from core.database import init_db, add_user, get_known_faces, get_recent_logs

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

@app.get("/api/admin/users")
async def list_registered_users():
    """Returns all registered staff for the management table."""
    return get_known_faces()

@app.delete("/api/admin/users/{name}")
async def purge_user(name: str):
    """Removes a user from the database and clears AI memory."""
    import sqlite3
    import os
    DB_PATH = os.path.join(os.path.dirname(__file__), "attendance.db")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM users WHERE name = ?", (name,))
    conn.commit()
    conn.close()
    
    # Hot-reload the AI memory so they aren't recognized anymore
    recognizer.load_memory(get_known_faces())
    return {"status": "success", "message": f"Identity {name} deleted."}

@app.get("/api/admin/export")
async def export_logs():
    """Generates a CSV file of all attendance for payroll."""
    logs = get_recent_logs(limit=5000)
    file_path = "nexus_payroll_report.csv"
    
    with open(file_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Employee Name", "Timestamp (UTC)"])
        for log in logs:
            writer.writerow([log["name"], log["time"]])
            
    return FileResponse(path=file_path, filename="Nexus_Attendance_Report.csv", media_type='text/csv')