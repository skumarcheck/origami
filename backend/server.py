from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import asyncio
from concurrent.futures import ThreadPoolExecutor
from seed_data import generate_all_projects

# Config
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ PASSWORD HASHING ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

# ============ JWT TOKENS ============
def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ============ AUTH DEPENDENCY ============
async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        del user["_id"]
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ PYDANTIC MODELS ============
class RegisterInput(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class UpdateProfileInput(BaseModel):
    skill_level: Optional[str] = None
    age_range: Optional[str] = None
    name: Optional[str] = None

class OrigamiStep(BaseModel):
    step_number: int
    title: str
    instruction: str
    tip: Optional[str] = None

class OrigamiOut(BaseModel):
    id: str
    title: str
    description: str
    skill_level: str
    age_range: str
    season: str
    holiday: Optional[str] = None
    difficulty_rating: int
    estimated_time: str
    is_premium: bool
    has_video: bool
    icon_name: str
    color: str
    xp_reward: int
    steps: List[OrigamiStep] = []

class UserProgressOut(BaseModel):
    origami_id: str
    completed: bool
    current_step: int
    favorited: bool
    completed_at: Optional[str] = None

class SubscriptionOut(BaseModel):
    status: str
    trial_start: Optional[str] = None
    trial_end: Optional[str] = None
    days_remaining: int = 0

# ============ AUTH ROUTES ============
@api_router.post("/auth/register")
async def register(input: RegisterInput):
    email = input.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    now = datetime.now(timezone.utc)
    user_doc = {
        "name": input.name.strip(),
        "email": email,
        "password_hash": hash_password(input.password),
        "skill_level": None,
        "age_range": None,
        "xp_points": 0,
        "level": 1,
        "streak_days": 0,
        "subscription_status": "trial",
        "trial_start": now.isoformat(),
        "trial_end": (now + timedelta(days=30)).isoformat(),
        "created_at": now.isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    return {
        "user": {
            "id": user_id,
            "name": user_doc["name"],
            "email": email,
            "skill_level": None,
            "age_range": None,
            "xp_points": 0,
            "level": 1,
            "streak_days": 0,
            "subscription_status": "trial",
            "trial_start": user_doc["trial_start"],
            "trial_end": user_doc["trial_end"],
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

@api_router.post("/auth/login")
async def login(input: LoginInput):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    # Check and update trial status
    sub_status = user.get("subscription_status", "trial")
    if sub_status == "trial":
        trial_end = user.get("trial_end")
        if trial_end:
            trial_end_dt = datetime.fromisoformat(trial_end)
            if datetime.now(timezone.utc) > trial_end_dt:
                sub_status = "expired"
                await db.users.update_one({"_id": user["_id"]}, {"$set": {"subscription_status": "expired"}})
    return {
        "user": {
            "id": user_id,
            "name": user.get("name", ""),
            "email": email,
            "skill_level": user.get("skill_level"),
            "age_range": user.get("age_range"),
            "xp_points": user.get("xp_points", 0),
            "level": user.get("level", 1),
            "streak_days": user.get("streak_days", 0),
            "subscription_status": sub_status,
            "trial_start": user.get("trial_start"),
            "trial_end": user.get("trial_end"),
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    sub_status = user.get("subscription_status", "trial")
    if sub_status == "trial":
        trial_end = user.get("trial_end")
        if trial_end:
            trial_end_dt = datetime.fromisoformat(trial_end)
            if datetime.now(timezone.utc) > trial_end_dt:
                sub_status = "expired"
                await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": {"subscription_status": "expired"}})
                user["subscription_status"] = sub_status
    return user

@api_router.put("/auth/profile")
async def update_profile(input: UpdateProfileInput, user: dict = Depends(get_current_user)):
    update_data = {}
    if input.skill_level is not None:
        update_data["skill_level"] = input.skill_level
    if input.age_range is not None:
        update_data["age_range"] = input.age_range
    if input.name is not None:
        update_data["name"] = input.name.strip()
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update_data})
    updated = await db.users.find_one({"_id": ObjectId(user["id"])}, {"password_hash": 0})
    updated["id"] = str(updated["_id"])
    del updated["_id"]
    return updated

# ============ ORIGAMI ROUTES ============
@api_router.get("/origami")
async def list_origami(skill_level: Optional[str] = None, season: Optional[str] = None, holiday: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if skill_level:
        query["skill_level"] = skill_level
    if season and season != "all":
        query["season"] = season
    if holiday:
        query["holiday"] = holiday
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    origamis = await db.origami.find(query, {"_id": 0}).to_list(500)
    return origamis

@api_router.get("/origami/featured")
async def featured_origami():
    origamis = await db.origami.find({}, {"_id": 0}).to_list(100)
    import random
    if len(origamis) > 6:
        origamis = random.sample(origamis, 6)
    return origamis

@api_router.get("/origami/seasonal")
async def seasonal_origami():
    now = datetime.now(timezone.utc)
    month = now.month
    if month in [3, 4, 5]:
        current_season = "spring"
    elif month in [6, 7, 8]:
        current_season = "summer"
    elif month in [9, 10, 11]:
        current_season = "fall"
    else:
        current_season = "winter"
    # Get current season + holiday origamis
    query = {"$or": [{"season": current_season}, {"season": "all"}]}
    origamis = await db.origami.find(query, {"_id": 0}).to_list(500)
    # Also get holiday-specific ones
    holiday_map = {
        1: None, 2: "valentines", 3: "easter", 4: "easter",
        5: None, 6: None, 7: None, 8: None,
        9: None, 10: "halloween", 11: None, 12: "christmas"
    }
    current_holiday = holiday_map.get(month)
    holiday_origamis = []
    if current_holiday:
        holiday_origamis = await db.origami.find({"holiday": current_holiday}, {"_id": 0}).to_list(50)
    return {
        "current_season": current_season,
        "current_holiday": current_holiday,
        "seasonal": origamis,
        "holiday": holiday_origamis,
    }

@api_router.get("/origami/{origami_id}")
async def get_origami(origami_id: str):
    origami = await db.origami.find_one({"id": origami_id}, {"_id": 0})
    if not origami:
        raise HTTPException(status_code=404, detail="Origami not found")
    return origami

# ============ PROGRESS ROUTES ============
@api_router.get("/progress")
async def get_progress(user: dict = Depends(get_current_user)):
    progress = await db.progress.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return progress

@api_router.get("/progress/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    total_completed = await db.progress.count_documents({"user_id": user["id"], "completed": True})
    total_favorites = await db.progress.count_documents({"user_id": user["id"], "favorited": True})
    total_origami = await db.origami.count_documents({})
    return {
        "completed": total_completed,
        "favorites": total_favorites,
        "total_available": total_origami,
        "xp_points": user.get("xp_points", 0),
        "level": user.get("level", 1),
        "streak_days": user.get("streak_days", 0),
    }

@api_router.post("/progress/{origami_id}/step")
async def update_step(origami_id: str, step: int, user: dict = Depends(get_current_user)):
    existing = await db.progress.find_one({"user_id": user["id"], "origami_id": origami_id})
    if existing:
        await db.progress.update_one(
            {"user_id": user["id"], "origami_id": origami_id},
            {"$set": {"current_step": step}}
        )
    else:
        await db.progress.insert_one({
            "user_id": user["id"],
            "origami_id": origami_id,
            "completed": False,
            "current_step": step,
            "favorited": False,
            "completed_at": None,
        })
    return {"status": "ok"}

@api_router.post("/progress/{origami_id}/complete")
async def complete_origami(origami_id: str, user: dict = Depends(get_current_user)):
    origami = await db.origami.find_one({"id": origami_id}, {"_id": 0})
    if not origami:
        raise HTTPException(status_code=404, detail="Origami not found")
    now = datetime.now(timezone.utc).isoformat()
    existing = await db.progress.find_one({"user_id": user["id"], "origami_id": origami_id})
    if existing:
        if existing.get("completed"):
            return {"status": "already_completed"}
        await db.progress.update_one(
            {"user_id": user["id"], "origami_id": origami_id},
            {"$set": {"completed": True, "completed_at": now, "current_step": len(origami.get("steps", []))}}
        )
    else:
        await db.progress.insert_one({
            "user_id": user["id"],
            "origami_id": origami_id,
            "completed": True,
            "current_step": len(origami.get("steps", [])),
            "favorited": False,
            "completed_at": now,
        })
    xp = origami.get("xp_reward", 10)
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$inc": {"xp_points": xp}})
    return {"status": "completed", "xp_earned": xp}

@api_router.post("/progress/{origami_id}/favorite")
async def toggle_favorite(origami_id: str, user: dict = Depends(get_current_user)):
    existing = await db.progress.find_one({"user_id": user["id"], "origami_id": origami_id})
    if existing:
        new_val = not existing.get("favorited", False)
        await db.progress.update_one(
            {"user_id": user["id"], "origami_id": origami_id},
            {"$set": {"favorited": new_val}}
        )
        return {"favorited": new_val}
    else:
        await db.progress.insert_one({
            "user_id": user["id"],
            "origami_id": origami_id,
            "completed": False,
            "current_step": 0,
            "favorited": True,
            "completed_at": None,
        })
        return {"favorited": True}

@api_router.get("/progress/favorites")
async def get_favorites(user: dict = Depends(get_current_user)):
    favs = await db.progress.find({"user_id": user["id"], "favorited": True}, {"_id": 0}).to_list(100)
    origami_ids = [f["origami_id"] for f in favs]
    origamis = await db.origami.find({"id": {"$in": origami_ids}}, {"_id": 0}).to_list(100)
    return origamis

@api_router.get("/progress/completed")
async def get_completed(user: dict = Depends(get_current_user)):
    completed = await db.progress.find({"user_id": user["id"], "completed": True}, {"_id": 0}).to_list(100)
    origami_ids = [c["origami_id"] for c in completed]
    origamis = await db.origami.find({"id": {"$in": origami_ids}}, {"_id": 0}).to_list(100)
    return origamis

# ============ SUBSCRIPTION ROUTES ============
@api_router.get("/subscription/status")
async def subscription_status(user: dict = Depends(get_current_user)):
    sub_status = user.get("subscription_status", "trial")
    trial_end = user.get("trial_end")
    days_remaining = 0
    if trial_end and sub_status == "trial":
        trial_end_dt = datetime.fromisoformat(trial_end)
        diff = trial_end_dt - datetime.now(timezone.utc)
        days_remaining = max(0, diff.days)
        if days_remaining == 0:
            sub_status = "expired"
            await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": {"subscription_status": "expired"}})
    return {
        "status": sub_status,
        "trial_start": user.get("trial_start"),
        "trial_end": trial_end,
        "days_remaining": days_remaining,
    }

@api_router.post("/subscription/activate")
async def activate_subscription(user: dict = Depends(get_current_user)):
    """Simulated payment activation - In production, this would verify PayPal payment"""
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"subscription_status": "active"}}
    )
    return {"status": "active", "message": "Subscription activated successfully!"}

# ============ VIDEO & AUDIO GENERATION (PER-STEP) ============
executor = ThreadPoolExecutor(max_workers=2)

def _generate_step_video_sync(origami_title, origami_id, step_num, instruction):
    """Generate a Sora 2 video for a single origami step with ultra-specific prompt."""
    from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration
    video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
    # Craft a precise visual description from the instruction
    action = instruction.lower().rstrip('.')
    prompt = (
        f"A kind smiling woman sitting at a bright colorful desk, slowly and carefully "
        f"folding a piece of colorful paper. She is doing the following: {action}. "
        f"Her hands move very slowly showing every fold clearly to the camera. "
        f"She does not speak or open her mouth. The room is bright and cheerful. "
        f"Smooth steady camera, no shaking. Simple calm paper folding tutorial."
    )
    if len(prompt) > 900:
        prompt = prompt[:900]
    output_path = f"/app/backend/videos/{origami_id}_step_{step_num}.mp4"
    video_bytes = video_gen.text_to_video(
        prompt=prompt, model="sora-2", size="1280x720", duration=8, max_wait_time=900,
    )
    if video_bytes:
        video_gen.save_video(video_bytes, output_path)
        return f"{origami_id}_step_{step_num}.mp4"
    return None

async def _generate_step_audio(origami_title, step, origami_id, step_num, is_first, is_last):
    """Generate TTS narration for a single step."""
    from emergentintegrations.llm.openai import OpenAITextToSpeech
    tts = OpenAITextToSpeech(api_key=os.environ['EMERGENT_LLM_KEY'])
    script = ""
    if is_first:
        script += f"Welcome to the {origami_title} tutorial! "
    script += f"Step {step['step_number']}: {step['title']}. {step['instruction']} "
    if step.get('tip'):
        script += f"Here's a tip: {step['tip']} "
    if is_last:
        script += f"Amazing! You've completed the {origami_title}! Great job!"
    audio_bytes = await tts.generate_speech(
        text=script, model="tts-1", voice="shimmer", speed=0.9, response_format="mp3",
    )
    output_path = f"/app/backend/audio/{origami_id}_step_{step_num}.mp3"
    with open(output_path, "wb") as f:
        f.write(audio_bytes)
    return f"{origami_id}_step_{step_num}.mp3"

@api_router.post("/admin/generate-step-media/{origami_id}")
async def generate_step_media(origami_id: str, user: dict = Depends(get_current_user)):
    """Generate per-step videos + audio for an origami project."""
    origami = await db.origami.find_one({"id": origami_id}, {"_id": 0})
    if not origami:
        raise HTTPException(status_code=404, detail="Origami not found")
    steps = origami.get("steps", [])
    if not steps:
        raise HTTPException(status_code=400, detail="No steps found")
    step_videos = []
    step_audio = []
    total = len(steps)
    for i, step in enumerate(steps):
        sn = step["step_number"]
        logger.info(f"[{origami_id}] Generating step {sn}/{total} video...")
        loop = asyncio.get_event_loop()
        vf = await loop.run_in_executor(executor, _generate_step_video_sync, origami["title"], origami_id, sn, step["instruction"])
        step_videos.append(vf)
        logger.info(f"[{origami_id}] Generating step {sn}/{total} audio...")
        af = await _generate_step_audio(origami["title"], step, origami_id, sn, i == 0, i == total - 1)
        step_audio.append(af)
        logger.info(f"[{origami_id}] Step {sn}/{total} done!")
    await db.origami.update_one({"id": origami_id}, {"$set": {
        "step_videos": step_videos,
        "step_audio": step_audio,
        "has_video": True,
        "is_premium": True,
    }})
    logger.info(f"[{origami_id}] All {total} steps generated!")
    return {"status": "success", "step_videos": step_videos, "step_audio": step_audio}

@api_router.post("/admin/generate-video/{origami_id}")
async def generate_video_endpoint(origami_id: str, user: dict = Depends(get_current_user)):
    origami = await db.origami.find_one({"id": origami_id}, {"_id": 0})
    if not origami:
        raise HTTPException(status_code=404, detail="Origami not found")
    logger.info(f"Starting video generation for {origami_id}...")
    loop = asyncio.get_event_loop()
    vf = await loop.run_in_executor(executor, _generate_step_video_sync, origami["title"], origami_id, 1, origami["steps"][0]["instruction"] if origami.get("steps") else "folding paper")
    if vf:
        await db.origami.update_one({"id": origami_id}, {"$set": {"video_file": vf, "has_video": True, "is_premium": True}})
        return {"status": "success", "video_file": vf}
    raise HTTPException(status_code=500, detail="Video generation failed")

@api_router.post("/admin/generate-audio/{origami_id}")
async def generate_audio_endpoint(origami_id: str, user: dict = Depends(get_current_user)):
    origami = await db.origami.find_one({"id": origami_id}, {"_id": 0})
    if not origami:
        raise HTTPException(status_code=404, detail="Origami not found")
    steps = origami.get("steps", [])
    if steps:
        af = await _generate_step_audio(origami["title"], steps[0], origami_id, 1, True, len(steps) == 1)
        await db.origami.update_one({"id": origami_id}, {"$set": {"audio_file": af}})
        return {"status": "success", "audio_file": af}
    raise HTTPException(status_code=500, detail="No steps to generate audio for")


# ============ SEED DATABASE ============
async def seed_database():
    count = await db.origami.count_documents({})
    if count < 100:
        if count > 0:
            await db.origami.drop()
            logger.info("Dropped old origami data for reseed")
        all_projects = generate_all_projects()
        logger.info(f"Seeding {len(all_projects)} origami projects...")
        await db.origami.insert_many(all_projects)
        logger.info(f"Seeded {len(all_projects)} origami projects!")
    else:
        logger.info(f"Database already has {count} origami projects, skipping seed")

    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@origami.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        now = datetime.now(timezone.utc)
        await db.users.insert_one({
            "name": "Admin",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "skill_level": "advanced",
            "age_range": "11+",
            "xp_points": 0,
            "level": 1,
            "streak_days": 0,
            "subscription_status": "active",
            "trial_start": now.isoformat(),
            "trial_end": (now + timedelta(days=30)).isoformat(),
            "created_at": now.isoformat(),
            "role": "admin",
        })
        logger.info("Admin user seeded")

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.origami.create_index("skill_level")
    await db.origami.create_index("season")
    await db.origami.create_index("holiday")
    await db.progress.create_index([("user_id", 1), ("origami_id", 1)], unique=True)

# ============ APP EVENTS ============
@app.on_event("startup")
async def startup():
    await seed_database()
    logger.info("Origami app started successfully!")

@app.on_event("shutdown")
async def shutdown():
    client.close()

# Include router and middleware
app.include_router(api_router)

# Serve static video and audio files
os.makedirs("/app/backend/videos", exist_ok=True)
os.makedirs("/app/backend/audio", exist_ok=True)
app.mount("/api/videos", StaticFiles(directory="/app/backend/videos"), name="videos")
app.mount("/api/audio", StaticFiles(directory="/app/backend/audio"), name="audio")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
