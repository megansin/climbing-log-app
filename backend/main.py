from fastapi import FastAPI
from routes import gyms, auth, sessions
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(gyms.router, prefix="/gyms", tags=["gyms"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Climbing log API is running"}