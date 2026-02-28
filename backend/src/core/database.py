import sqlite3
import json
import os
from datetime import datetime

# Create the DB file one level up, in the backend root
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "attendance.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            embedding TEXT NOT NULL
        )
    ''')
    # NEW: The Attendance Logbook
    c.execute('''
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def add_user(name: str, embedding: list):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute('INSERT OR REPLACE INTO users (name, embedding) VALUES (?, ?)', 
                  (name, json.dumps(embedding)))
        conn.commit()
    finally:
        conn.close()

def get_known_faces():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT name, embedding FROM users')
    rows = c.fetchall()
    conn.close()
    
    known_faces = []
    for row in rows:
        known_faces.append({
            "name": row[0],
            "embedding": json.loads(row[1])
        })
    return known_faces

def mark_attendance(name: str):
    """Logs attendance with a 5-minute cooldown per user."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Check the last time this exact user was seen
    c.execute('''
        SELECT timestamp FROM attendance_logs 
        WHERE name = ? 
        ORDER BY timestamp DESC LIMIT 1
    ''', (name,))
    last_log = c.fetchone()
    
    should_log = True
    if last_log:
        # Calculate time difference
        last_time = datetime.strptime(last_log[0], '%Y-%m-%d %H:%M:%S')
        diff = (datetime.utcnow() - last_time).total_seconds()
        if diff < 300:  # 300 seconds = 5 minutes cooldown
            should_log = False
    
    if should_log:
        c.execute('INSERT INTO attendance_logs (name) VALUES (?)', (name,))
        conn.commit()
        
    conn.close()
    return should_log

def get_recent_logs(limit=15):
    """Fetches the latest attendance logs for the frontend."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT name, timestamp FROM attendance_logs ORDER BY timestamp DESC LIMIT ?', (limit,))
    rows = c.fetchall()
    conn.close()
    
    logs = [{"name": r[0], "time": r[1]} for r in rows]
    return logs