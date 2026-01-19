from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class Climb(BaseModel):
    grade: str
    hold_type: str
    angle: str
    result: str # e.g., "Flash", "Send", "Attempt"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Session(BaseModel):
    username: str
    gym_id: str
    # Optional because these are filled when the session ends
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    fatigue_level: Optional[int] = None # Scale of 1-10
    
    # This list will hold the climbs as they are logged
    climbs: List[Climb] = []
    
    # Status helps you query "active" vs "finished" sessions
    status: str = "active"