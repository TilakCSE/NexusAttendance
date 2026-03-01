# NEXUS // Spatial Attendance & Recognition Node

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

Nexus is a real-time, hybrid-AI spatial attendance system. It decouples heavy biometric machine learning from the client by streaming live webcam data over WebSockets to a Python backend, where state-of-the-art neural networks extract 512-dimensional facial embeddings to seamlessly identify and log personnel.

## 🧠 System Architecture

This project utilizes a decoupled client-server architecture to ensure the frontend remains entirely frictionless while the backend handles intensive computer vision tasks.

* **The Vision Core (Backend):** Built with **FastAPI** and **Python**. It utilizes the `buffalo_l` model from InsightFace.
* **The Memory Layer (Database):** A localized **SQLite** database stores 512-D vector embeddings. Live faces are matched against this database using Cosine Similarity math.
* **The Command Deck (Frontend):** A cinematic UI built with **Next.js**, **React**, and **Tailwind CSS**. 
* **The Transport Layer:** High-speed **WebSockets** handle bidirectional data transfer.

## 🚀 Key Features

* **Zero-Click Attendance:** Personnel are recognized and logged simply by entering the spatial frame of the camera.
* **Biometric Registration:** Register new identities directly from the UI. The AI hot-reloads its memory bank instantly.
* **Anti-Spam Cooldown Logic:** The database utilizes a 5-minute cooldown throttle to prevent log-spamming.
* **NEXUS_ADMIN Command Center:** A secured CRUD dashboard to view registered personnel, purge biometric records, and export `.csv` payroll reports.

## ⚙️ Quick Start Installation

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
pip install fastapi uvicorn opencv-python insightface onnxruntime websockets
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Boot Sequence

You must run both servers simultaneously. 

**Terminal 1 (Backend):**
```bash
cd backend/src
uvicorn main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:3000` to access the main Kiosk.

### 🛡️ License
MIT License
