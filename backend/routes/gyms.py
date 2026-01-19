from fastapi import APIRouter, HTTPException, Depends
from models.gym import Gym
from database import db
from routes.auth import verify_token

router = APIRouter()

# create new gym if user is auth
@router.post("/")
def create_gym(gym: Gym, user: dict = Depends(verify_token)):
    if db.gyms.find_one({"location": gym.location, "setting_style": gym.setting_style}):
        raise HTTPException(status_code=400, detail="Gym already exists")
    
    db.gyms.insert_one(gym.dict())
    return {"message": "Gym added successfully"}

# get all gyms
@router.get("/")
def get_gyms():
    return list(db.gyms.find({}, {"_id": 0}))
