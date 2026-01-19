# 🧗‍♂️ ClimbTrack: Full-Stack Bouldering Analytics

A full-stack performance tracking application for climbers. This isn't just a logbook—it’s a data platform designed to analyze climbing biomechanics, fatigue levels, and proficiency across different hold types and wall angles.


## Features

* **Session-Based Logging**: Start sessions at specific gyms and track performance in real-time.
* **Granular Data Entry**: Log grades (V0-V13+), hold types (Crimps, Slopers, etc.), wall angles (Slab, Roof, etc.), and climbing styles.
* **Performance Analytics**: Automated success-rate calculation based on hold type proficiency.
* **Fatigue Tracking**: Post-session "Fatigue Level" (1-5) logging to analyze overtraining patterns. (WIP)
* **Secure Auth**: JWT-based authentication with protected API routes.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Vite |
| **Backend** | FastAPI (Python 3.10+) |
| **Database** | MongoDB |
| **Authentication** | JWT (JSON Web Tokens) & Passlib |

## Data Insights

The application transforms raw climb logs into actionable insights using custom data transformation helpers.
* **Success Rate by Hold**: Uses a reduction algorithm to determine which hold types have the highest "Send" percentage.
* **Volume Tracking**: Monitors total climbs per session and tracks "Personal Bests" over time.



## Installation & Setup

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# .\venv\Scripts\activate # Windows
pip install -r requirements.txt
uvicorn main:app --reload

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev

### 3. Environment Variables
Create a .env file in the /backend folder:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key

## 📐 API Architecture
The backend follows a RESTful pattern with the following key endpoints:

POST /auth/login: Authenticates user and returns JWT.
GET /gyms/: Fetches available climbing locations.
POST /sessions/start: Initializes a new climbing session.
POST /sessions/{id}/climb: Appends a climb object to the active session.
PATCH /sessions/{id}/end: Finalizes session with duration and fatigue metrics.
GET /sessions/history: Retrieves all historical data for the user.
