from fastapi import FastAPI
from routes import gyms

app = FastAPI()
app.include_router(gyms.router, prefix="/gyms", tags=["gyms"])

@app.get("/")
def root():
    return {"message": "Climbing log API is running"}
