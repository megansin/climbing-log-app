from fastapi import APIRouter
from models.gym import Gym
from database import db

router = APIRouter()

# create new gym
@router.post("/")
def create_gym(gym: Gym):
    db.gyms.insert_one(gym.dict())
    return gym

# get all gyms
@router.get("/")
def get_gyms():
    return list(db.gyms.find({}, {"_id": 0}))
