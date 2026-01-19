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

# 4. GET ALL SESSIONS (For History View)
@router.get("/history")
async def get_history(user: dict = Depends(verify_token)):
    # 1. Get the cursor
    cursor = db.sessions.find({"username": user["username"]}).sort("start_time", -1)
    
    # 2. Convert cursor to a list (Removing .to_list() and await)
    history = list(cursor)
    
    # 3. Clean up MongoDB ObjectIds for JSON compatibility
    for s in history:
        s["id"] = str(s["_id"])
        del s["_id"]
        
    return history

# 5. DELETE SESSION
@router.delete("/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(verify_token)):
    # No await here if using standard pymongo
    result = db.sessions.delete_one(
        {"_id": ObjectId(session_id), "username": user["username"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}
    