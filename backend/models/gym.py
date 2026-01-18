from pydantic import BaseModel

class Gym(BaseModel):
    name: str
    location: str
    setting_style: str
