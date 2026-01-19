from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from database import db
from models.session import Session, Climb
from routes.auth import verify_token

router = APIRouter()

# 1. START SESSION
@router.post("/start")
async def start_session(gym_id: str, user: dict = Depends(verify_token)):
    new_session = Session(
        username=user["username"],
        gym_id=gym_id,
        start_time=datetime.utcnow(),
        status="active"
    )
    result = db.sessions.insert_one(new_session.dict())
    return {"session_id": str(result.inserted_id)}

# 2. LOG CLIMB (Add to the list)
@router.post("/{session_id}/climb")
async def add_climb(session_id: str, climb: Climb, user: dict = Depends(verify_token)):
    result = db.sessions.update_one(
        {"_id": ObjectId(session_id), "username": user["username"]},
        {"$push": {"climbs": climb.dict()}}
    )
    return {"message": "Climb added"}

# 3. END SESSION (Calculate duration & fatigue)
@router.patch("/{session_id}/end")
async def end_session(session_id: str, fatigue: int, user: dict = Depends(verify_token)):
    session_data = db.sessions.find_one({"_id": ObjectId(session_id)})
    
    end_time = datetime.utcnow()
    duration = (end_time - session_data["start_time"]).total_seconds() / 60
    
    db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "end_time": end_time,
            "duration_minutes": round(duration, 2),
            "fatigue_level": fatigue,
            "status": "completed"
        }}
    )
    return {"message": "Session finalized"}