from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
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
        query["$or"] = [{"season": season}, {"season": "all"}]
    if holiday:
        query["holiday"] = holiday
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    origamis = await db.origami.find(query, {"_id": 0}).to_list(100)
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
    origamis = await db.origami.find(query, {"_id": 0}).to_list(100)
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

# ============ SEED DATA ============
ORIGAMI_SEED = [
    {
        "id": "crane-001",
        "title": "Paper Crane",
        "description": "The classic origami crane - a symbol of peace and good luck! Legend says folding 1000 cranes grants a wish.",
        "skill_level": "intermediate",
        "age_range": "8-10",
        "season": "all",
        "holiday": None,
        "difficulty_rating": 3,
        "estimated_time": "15 min",
        "is_premium": True,
        "has_video": True,
        "icon_name": "bird",
        "color": "#38BDF8",
        "xp_reward": 30,
        "steps": [
            {"step_number": 1, "title": "Start with a Square", "instruction": "Place your square paper with the colored side facing down. Fold it in half diagonally to make a triangle, then unfold.", "tip": "Use crisp, clean folds for the best result!"},
            {"step_number": 2, "title": "Make an X", "instruction": "Fold diagonally the other way to make an X crease pattern. Unfold again.", "tip": None},
            {"step_number": 3, "title": "Square Base", "instruction": "Fold the paper in half horizontally, then collapse it into a square base using the creases you made.", "tip": "This is the foundation for many origami designs!"},
            {"step_number": 4, "title": "Kite Folds", "instruction": "Fold the front flaps to the center line to make a kite shape. Flip and repeat on the back.", "tip": None},
            {"step_number": 5, "title": "Petal Fold", "instruction": "Unfold the kite folds. Lift the bottom point up and fold the sides in using the creases. Repeat on the back.", "tip": "This is the trickiest part - take your time!"},
            {"step_number": 6, "title": "Head and Tail", "instruction": "Fold one thin point up for the neck, then reverse-fold the tip to create the head. Leave the other point as the tail.", "tip": None},
            {"step_number": 7, "title": "Spread the Wings", "instruction": "Gently pull the wings apart and push down on the body to give your crane a 3D shape. Done!", "tip": "Be gentle - you don't want to tear the paper!"},
        ]
    },
    {
        "id": "airplane-001",
        "title": "Paper Airplane",
        "description": "The ultimate classic! Make a paper airplane that flies super far across the room.",
        "skill_level": "beginner",
        "age_range": "5-7",
        "season": "all",
        "holiday": None,
        "difficulty_rating": 1,
        "estimated_time": "5 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "airplane",
        "color": "#4ADE80",
        "xp_reward": 10,
        "steps": [
            {"step_number": 1, "title": "Fold in Half", "instruction": "Take a rectangular piece of paper. Fold it in half lengthwise (the long way). Make a sharp crease and unfold.", "tip": "Use a ruler to make extra crisp folds!"},
            {"step_number": 2, "title": "Fold Corners", "instruction": "Fold both top corners down to meet the center crease line. You should have a pointy top now.", "tip": None},
            {"step_number": 3, "title": "Fold Again", "instruction": "Fold the new angled edges to the center line again. The point gets even pointier!", "tip": None},
            {"step_number": 4, "title": "Fold in Half", "instruction": "Fold the whole airplane in half along the center crease, with the folds on the inside.", "tip": None},
            {"step_number": 5, "title": "Make Wings", "instruction": "Fold each side down to make the wings. Leave about 1 inch at the bottom for the body.", "tip": "Make both wings the same size for straight flying!"},
            {"step_number": 6, "title": "Ready to Fly!", "instruction": "Open the wings so they stick out sideways. Hold the bottom and throw gently forward. Watch it soar!", "tip": "Throw gently - not hard! Adjust wing angles to change flight path."},
        ]
    },
    {
        "id": "boat-001",
        "title": "Sailing Boat",
        "description": "Make a cute little boat that can actually float on water! Perfect for summer fun.",
        "skill_level": "beginner",
        "age_range": "5-7",
        "season": "summer",
        "holiday": None,
        "difficulty_rating": 1,
        "estimated_time": "8 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "boat",
        "color": "#38BDF8",
        "xp_reward": 10,
        "steps": [
            {"step_number": 1, "title": "Fold Rectangle", "instruction": "Start with a rectangular piece of paper. Fold it in half from top to bottom.", "tip": None},
            {"step_number": 2, "title": "Fold Corners Down", "instruction": "Fold both top corners down to the center to make a triangle at the top.", "tip": "Leave a strip at the bottom showing."},
            {"step_number": 3, "title": "Fold Flaps Up", "instruction": "Fold the bottom flap up on the front side. Flip over and fold the other flap up too.", "tip": None},
            {"step_number": 4, "title": "Tuck Corners", "instruction": "Tuck the little triangles at the sides behind the main shape to make a clean triangle.", "tip": None},
            {"step_number": 5, "title": "Open and Flatten", "instruction": "Open the triangle from the bottom and flatten it into a diamond/square shape.", "tip": "This part is like magic!"},
            {"step_number": 6, "title": "Pull Apart", "instruction": "Hold the top points and gently pull them apart. The boat shape will pop out! Flatten the bottom.", "tip": "Try floating it in a bowl of water!"},
        ]
    },
    {
        "id": "puppy-001",
        "title": "Puppy Face",
        "description": "Create an adorable puppy face with floppy ears! Draw cute eyes and a nose to finish.",
        "skill_level": "beginner",
        "age_range": "5-7",
        "season": "all",
        "holiday": None,
        "difficulty_rating": 1,
        "estimated_time": "5 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "paw",
        "color": "#FB923C",
        "xp_reward": 10,
        "steps": [
            {"step_number": 1, "title": "Make a Triangle", "instruction": "Start with a square piece of paper. Fold it in half diagonally to make a big triangle.", "tip": "Colored side out looks best!"},
            {"step_number": 2, "title": "Position Triangle", "instruction": "Hold the triangle with the long flat side at the top and the point facing down.", "tip": None},
            {"step_number": 3, "title": "Fold Ears Down", "instruction": "Fold the left corner down and to the side for one floppy ear. Do the same with the right corner.", "tip": "Make them droop for extra cuteness!"},
            {"step_number": 4, "title": "Fold the Nose", "instruction": "Fold the bottom point up a little bit to make the puppy's chin/nose area.", "tip": None},
            {"step_number": 5, "title": "Add a Face!", "instruction": "Draw two big eyes and a little black nose with a marker. Add a mouth if you want! Your puppy is done!", "tip": "Give your puppy a name!"},
        ]
    },
    {
        "id": "tulip-001",
        "title": "Spring Tulip",
        "description": "A beautiful paper tulip flower to celebrate spring! Make a whole bouquet in different colors.",
        "skill_level": "beginner",
        "age_range": "5-7",
        "season": "spring",
        "holiday": "easter",
        "difficulty_rating": 2,
        "estimated_time": "10 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "flower",
        "color": "#F472B6",
        "xp_reward": 15,
        "steps": [
            {"step_number": 1, "title": "Start with a Diamond", "instruction": "Place your square paper like a diamond (corner pointing at you). Fold in half to make a triangle.", "tip": "Try using red, pink, or yellow paper!"},
            {"step_number": 2, "title": "Fold Right Side Up", "instruction": "Fold the right corner up past the top center point at a slight angle.", "tip": None},
            {"step_number": 3, "title": "Fold Left Side Up", "instruction": "Fold the left corner up to match the right side. Your tulip shape is forming!", "tip": "Both sides should look symmetrical."},
            {"step_number": 4, "title": "Fold Bottom Up", "instruction": "Flip the paper over. Fold the bottom point up and tuck it behind.", "tip": None},
            {"step_number": 5, "title": "Shape the Sides", "instruction": "Fold the left and right corners behind slightly to round your tulip shape.", "tip": None},
            {"step_number": 6, "title": "Make a Stem!", "instruction": "Roll a thin strip of green paper for the stem. Tape it to the back of your tulip. Beautiful!", "tip": "Make a whole garden with different colored tulips!"},
        ]
    },
    {
        "id": "heart-001",
        "title": "Love Heart",
        "description": "Fold a sweet paper heart! Perfect for Valentine's Day cards or to give to someone special.",
        "skill_level": "beginner",
        "age_range": "5-7",
        "season": "all",
        "holiday": "valentines",
        "difficulty_rating": 2,
        "estimated_time": "8 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "heart",
        "color": "#FB7185",
        "xp_reward": 15,
        "steps": [
            {"step_number": 1, "title": "Fold in Quarters", "instruction": "Start with a square piece of paper. Fold in half both ways (up-down and left-right) and unfold to see a + shape crease.", "tip": "Red or pink paper is perfect!"},
            {"step_number": 2, "title": "Fold Bottom Up", "instruction": "Fold the bottom edge up to the center horizontal crease.", "tip": None},
            {"step_number": 3, "title": "Fold Top Down", "instruction": "Flip the paper over. Fold both bottom corners up to the top center to make a triangle shape at the bottom.", "tip": None},
            {"step_number": 4, "title": "Shape the Top", "instruction": "Fold the top corners of each triangle down slightly to create the rounded bumps of the heart.", "tip": "Small folds make it look more heart-shaped!"},
            {"step_number": 5, "title": "Final Touches", "instruction": "Flip over to see your beautiful heart! Tuck any loose corners behind for a clean look.", "tip": "Write a message on it for someone you love!"},
        ]
    },
    {
        "id": "frog-001",
        "title": "Jumping Frog",
        "description": "This frog actually jumps when you press its back! Have a frog jumping contest with friends.",
        "skill_level": "intermediate",
        "age_range": "8-10",
        "season": "spring",
        "holiday": None,
        "difficulty_rating": 3,
        "estimated_time": "12 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "leaf",
        "color": "#4ADE80",
        "xp_reward": 25,
        "steps": [
            {"step_number": 1, "title": "Start Rectangle", "instruction": "Use a rectangular piece of paper. Fold the top right corner to the left edge and unfold. Repeat with top left corner.", "tip": "Regular notebook paper works great!"},
            {"step_number": 2, "title": "Make X Crease", "instruction": "You should see an X crease at the top. Fold along the bottom of the X (horizontal line) and unfold.", "tip": None},
            {"step_number": 3, "title": "Collapse Triangle", "instruction": "Push the sides in along the creases to collapse the top into a triangle shape sitting on a rectangle.", "tip": "This is like making a water bomb base!"},
            {"step_number": 4, "title": "Make Front Legs", "instruction": "Fold the two top layer triangle flaps up and outward to form the frog's front legs.", "tip": "Make them stick out at angles!"},
            {"step_number": 5, "title": "Fold Sides In", "instruction": "Fold the left and right edges of the rectangle part to meet at the center.", "tip": None},
            {"step_number": 6, "title": "Fold Bottom Up", "instruction": "Fold the bottom rectangle edge up to meet the base of the triangle.", "tip": None},
            {"step_number": 7, "title": "Make the Spring", "instruction": "Fold the bottom section in half back down. This creates the spring that makes your frog jump! Press the back and watch it hop!", "tip": "Press quickly on the back edge and release for the biggest jumps!"},
        ]
    },
    {
        "id": "butterfly-001",
        "title": "Beautiful Butterfly",
        "description": "Create a graceful butterfly with delicate wings! Hang them up to decorate your room.",
        "skill_level": "intermediate",
        "age_range": "8-10",
        "season": "spring",
        "holiday": None,
        "difficulty_rating": 3,
        "estimated_time": "12 min",
        "is_premium": True,
        "has_video": True,
        "icon_name": "leaf",
        "color": "#C084FC",
        "xp_reward": 25,
        "steps": [
            {"step_number": 1, "title": "Crease Pattern", "instruction": "Start with a square. Fold in half both ways, then diagonally both ways. You should have a star pattern of creases.", "tip": "Use colorful paper for beautiful wings!"},
            {"step_number": 2, "title": "Triangle Base", "instruction": "Collapse the paper into a triangle base (waterbomb base) using the diagonal and horizontal creases.", "tip": None},
            {"step_number": 3, "title": "Fold Wings Up", "instruction": "Take the top layer corners of the triangle and fold them up past the top edge. These will become wings.", "tip": "Don't fold exactly to the top - go slightly above for a more natural look."},
            {"step_number": 4, "title": "Flip and Fold", "instruction": "Turn the model over. Fold the bottom point up past the top edge so a little bit sticks out over the top.", "tip": None},
            {"step_number": 5, "title": "Fold in Half", "instruction": "Fold the model in half vertically. Pinch the center body firmly.", "tip": None},
            {"step_number": 6, "title": "Spread Wings", "instruction": "Gently spread the wings open. Shape them by curving slightly. Your butterfly is ready to fly!", "tip": "Attach a string to hang it as a mobile!"},
        ]
    },
    {
        "id": "fox-001",
        "title": "Clever Fox",
        "description": "Fold a cute fox face with pointy ears! Perfect for fall and autumn crafts.",
        "skill_level": "intermediate",
        "age_range": "8-10",
        "season": "fall",
        "holiday": None,
        "difficulty_rating": 2,
        "estimated_time": "8 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "paw",
        "color": "#FB923C",
        "xp_reward": 20,
        "steps": [
            {"step_number": 1, "title": "Start Triangle", "instruction": "Start with a square piece of orange paper. Fold it diagonally to make a triangle.", "tip": "Orange or red paper works best for a fox!"},
            {"step_number": 2, "title": "Fold in Half", "instruction": "Fold the triangle in half from left to right, then unfold. This marks the center.", "tip": None},
            {"step_number": 3, "title": "Fold Ears Up", "instruction": "With the long edge at the bottom, fold the two bottom corners up at angles to create the fox's pointy ears.", "tip": "Make them symmetrical!"},
            {"step_number": 4, "title": "Fold the Nose", "instruction": "Fold the top point (single layer) down to make the fox's snout/nose area.", "tip": None},
            {"step_number": 5, "title": "Add Details", "instruction": "Flip over to see your fox face! Draw two clever eyes and a black triangle nose. Maybe add whiskers!", "tip": "Give your fox a sly smile!"},
        ]
    },
    {
        "id": "star-001",
        "title": "Christmas Star",
        "description": "A beautiful 3D star to top your Christmas tree or hang as decoration!",
        "skill_level": "intermediate",
        "age_range": "8-10",
        "season": "winter",
        "holiday": "christmas",
        "difficulty_rating": 3,
        "estimated_time": "15 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "star",
        "color": "#FDE047",
        "xp_reward": 25,
        "steps": [
            {"step_number": 1, "title": "Prepare Two Squares", "instruction": "You need 2 square pieces of paper (gold or yellow looks great!). Take the first square.", "tip": "Shiny paper makes the best stars!"},
            {"step_number": 2, "title": "First Piece", "instruction": "Fold the square in half both ways and diagonally both ways. Collapse into a small square (preliminary base).", "tip": None},
            {"step_number": 3, "title": "Kite Shape", "instruction": "Fold the front edges to the center to make a kite shape. Repeat on all four faces.", "tip": None},
            {"step_number": 4, "title": "Second Piece", "instruction": "Repeat steps 2-3 with the second square of paper.", "tip": None},
            {"step_number": 5, "title": "Join Together", "instruction": "Slide one piece into the other, interlocking the flaps. Tuck and secure each flap.", "tip": "This takes patience - go slowly!"},
            {"step_number": 6, "title": "Shape Your Star", "instruction": "Gently pull and shape each point of the star. Puff out the center for a 3D look!", "tip": "Attach a string to hang it up!"},
        ]
    },
    {
        "id": "dragon-001",
        "title": "Fire Dragon",
        "description": "The ultimate origami challenge! Create a fearsome dragon with wings, claws, and a tail.",
        "skill_level": "advanced",
        "age_range": "11+",
        "season": "all",
        "holiday": None,
        "difficulty_rating": 5,
        "estimated_time": "30 min",
        "is_premium": True,
        "has_video": True,
        "icon_name": "flame",
        "color": "#EF4444",
        "xp_reward": 50,
        "steps": [
            {"step_number": 1, "title": "Bird Base", "instruction": "Create a bird base: start with a preliminary base, then perform petal folds on both sides.", "tip": "Master the crane first if this is your first advanced model!"},
            {"step_number": 2, "title": "Narrow the Points", "instruction": "Fold the front flaps' edges to the center line. Repeat on all sides to create thin, narrow points.", "tip": None},
            {"step_number": 3, "title": "Fold in Half", "instruction": "Fold the model in half so the thin points stick out from one end.", "tip": None},
            {"step_number": 4, "title": "Shape the Neck", "instruction": "Reverse-fold one point upward at an angle to create the dragon's long neck.", "tip": "The angle determines how your dragon will look!"},
            {"step_number": 5, "title": "Create the Head", "instruction": "Reverse-fold the tip of the neck to create the head. Add a small reverse fold for the mouth.", "tip": None},
            {"step_number": 6, "title": "Shape the Wings", "instruction": "Fold the top layers outward on each side to create the dragon's wings. Crease firmly.", "tip": "Make the wings spread wide for a dramatic look!"},
            {"step_number": 7, "title": "Add Details", "instruction": "Create horns with tiny reverse folds on the head. Shape the tail with accordion folds.", "tip": None},
            {"step_number": 8, "title": "Final Shaping", "instruction": "Gently curve the wings, tail, and neck. Add dimension by pulling layers apart slightly. Your dragon is complete!", "tip": "Try different colored paper - red for fire, blue for ice, green for forest dragon!"},
        ]
    },
    {
        "id": "rose-001",
        "title": "Elegant Rose",
        "description": "Fold a stunningly realistic paper rose. A perfect gift that will never wilt!",
        "skill_level": "advanced",
        "age_range": "11+",
        "season": "spring",
        "holiday": "valentines",
        "difficulty_rating": 5,
        "estimated_time": "25 min",
        "is_premium": True,
        "has_video": True,
        "icon_name": "flower",
        "color": "#FB7185",
        "xp_reward": 50,
        "steps": [
            {"step_number": 1, "title": "Grid Creases", "instruction": "Start with a square. Fold into thirds both horizontally and vertically to create a 3x3 grid of creases.", "tip": "Use red or pink paper for the most realistic look!"},
            {"step_number": 2, "title": "Diagonal Creases", "instruction": "Add diagonal creases in the center square of the grid. These will form the spiral center of the rose.", "tip": None},
            {"step_number": 3, "title": "Collapse Center", "instruction": "Using the creases, collapse the center into a small square twist. This is the heart of your rose.", "tip": "This step takes practice - don't give up!"},
            {"step_number": 4, "title": "First Layer Petals", "instruction": "Fold the four flaps around the center outward to create the first layer of inner petals.", "tip": None},
            {"step_number": 5, "title": "Second Layer", "instruction": "Fold the next set of flaps outward, slightly lower than the first layer.", "tip": "Each layer should be a bit more open than the last."},
            {"step_number": 6, "title": "Outer Petals", "instruction": "Fold the remaining paper outward to form the outermost petals of the rose.", "tip": None},
            {"step_number": 7, "title": "Curl and Shape", "instruction": "Use a pencil to gently curl each petal outward. Shape the rose into a natural, blooming form.", "tip": None},
            {"step_number": 8, "title": "Add a Stem", "instruction": "Roll green paper into a thin stem. Attach with tape. Add a leaf by folding a small green square diagonally.", "tip": "Make a whole bouquet for someone special!"},
        ]
    },
    {
        "id": "lotus-001",
        "title": "Lotus Flower",
        "description": "A serene and beautiful lotus flower with multiple layers of petals. Looks amazing floating in water!",
        "skill_level": "advanced",
        "age_range": "11+",
        "season": "summer",
        "holiday": None,
        "difficulty_rating": 4,
        "estimated_time": "20 min",
        "is_premium": True,
        "has_video": True,
        "icon_name": "flower",
        "color": "#EC4899",
        "xp_reward": 40,
        "steps": [
            {"step_number": 1, "title": "First Blintz", "instruction": "Start with a square. Fold all four corners to the center. This is called a blintz fold.", "tip": "Use white or pink paper for a classic lotus look!"},
            {"step_number": 2, "title": "Second Blintz", "instruction": "Fold all four new corners to the center again. Press firmly.", "tip": None},
            {"step_number": 3, "title": "Third Blintz", "instruction": "Fold all four corners to the center one more time. You now have three layers!", "tip": "Make sure all layers are crisp and tight."},
            {"step_number": 4, "title": "Flip and Fold", "instruction": "Flip the whole thing over. Fold the four corners to the center on this side too.", "tip": None},
            {"step_number": 5, "title": "Fold Corner Tips", "instruction": "Fold just the tiny tips of each corner toward the center (about 1cm).", "tip": None},
            {"step_number": 6, "title": "Pull First Petals", "instruction": "Hold the center firmly. Reach underneath each corner and carefully pull the flap up and over to create the first layer of petals.", "tip": "Be very gentle - the paper can tear!"},
            {"step_number": 7, "title": "More Petal Layers", "instruction": "Continue pulling up flaps from underneath to create 2 more layers of petals. Each layer opens more. Beautiful!", "tip": "Try floating your lotus in a bowl of water!"},
        ]
    },
    {
        "id": "bat-001",
        "title": "Spooky Bat",
        "description": "Create a Halloween bat with spread wings! Hang them upside down for the spookiest decoration.",
        "skill_level": "intermediate",
        "age_range": "8-10",
        "season": "fall",
        "holiday": "halloween",
        "difficulty_rating": 3,
        "estimated_time": "10 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "moon",
        "color": "#6366F1",
        "xp_reward": 20,
        "steps": [
            {"step_number": 1, "title": "Kite Base", "instruction": "Start with a square of black paper, placed like a diamond. Fold the left and right edges to the center crease to make a kite shape.", "tip": "Black paper is essential for a spooky bat!"},
            {"step_number": 2, "title": "Fold in Half", "instruction": "Fold the model in half vertically (left to right).", "tip": None},
            {"step_number": 3, "title": "Fold Wing Down", "instruction": "Fold the top layer back to the left to create the first wing. The fold should be at a slight angle.", "tip": None},
            {"step_number": 4, "title": "Second Wing", "instruction": "Flip over and fold the other side to match, creating the second wing.", "tip": "Make both wings match for a symmetrical bat!"},
            {"step_number": 5, "title": "Shape the Ears", "instruction": "At the top of the body, make two small cuts and fold up to create pointy ears.", "tip": None},
            {"step_number": 6, "title": "Spread Wings", "instruction": "Open the wings wide. Add googly eyes or draw them on. Hang upside down with string for Halloween!", "tip": "Make a whole colony of bats in different sizes!"},
        ]
    },
    {
        "id": "snowflake-001",
        "title": "Winter Snowflake",
        "description": "Every snowflake is unique - just like yours! Cut a beautiful paper snowflake for winter decorations.",
        "skill_level": "intermediate",
        "age_range": "8-10",
        "season": "winter",
        "holiday": "christmas",
        "difficulty_rating": 3,
        "estimated_time": "10 min",
        "is_premium": False,
        "has_video": False,
        "icon_name": "snow",
        "color": "#93C5FD",
        "xp_reward": 20,
        "steps": [
            {"step_number": 1, "title": "Make a Triangle", "instruction": "Start with a square of white or light blue paper. Fold it diagonally to make a triangle.", "tip": "Thin paper works best for cutting!"},
            {"step_number": 2, "title": "Fold Again", "instruction": "Fold the triangle in half again to make a smaller triangle.", "tip": None},
            {"step_number": 3, "title": "Fold in Thirds", "instruction": "Fold the triangle into thirds by bringing the right side over, then the left side on top. You should have a narrow cone shape.", "tip": "This creates the 6-fold symmetry of a real snowflake!"},
            {"step_number": 4, "title": "Trim the Top", "instruction": "Cut across the top at an angle to create a straight edge.", "tip": None},
            {"step_number": 5, "title": "Cut Designs", "instruction": "Cut small triangles, curves, and shapes along both edges. Be creative - each cut creates a mirror pattern!", "tip": "Don't cut all the way through - leave connected sections!"},
            {"step_number": 6, "title": "Unfold the Magic", "instruction": "Carefully unfold your paper to reveal your unique snowflake design! No two are alike!", "tip": "Tape them to windows for beautiful winter decorations!"},
        ]
    },
]

async def seed_database():
    count = await db.origami.count_documents({})
    if count == 0:
        logger.info("Seeding origami database...")
        await db.origami.insert_many(ORIGAMI_SEED)
        logger.info(f"Seeded {len(ORIGAMI_SEED)} origami projects")
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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
