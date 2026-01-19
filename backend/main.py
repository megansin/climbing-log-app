from fastapi import FastAPI
from routes import gyms, auth, sessions

app = FastAPI()
app.include_router(gyms.router, prefix="/gyms", tags=["gyms"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])


@app.get("/")
def root():
    return {"message": "Climbing log API is running"}