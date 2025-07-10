import json
import asyncio
from datetime import timedelta
from typing import List, Literal, Annotated
from bson import ObjectId
import redis.asyncio as aioredis
from bson.errors import InvalidId
from pymongo import ReturnDocument
from fastapi import FastAPI, Depends, HTTPException, status, Request, WebSocket, WebSocketDisconnect
import pytz
from datetime import datetime
from celery.result import AsyncResult
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, BeforeValidator
from pymongo import MongoClient
from pymongo.database import Database
from contextlib import asynccontextmanager
from nostr_utils import post_to_nostr_util
from dotenv import load_dotenv
import os

from agents.content_agent import get_agent_response as content_agent_response
from agents.persona_agent import get_agent_response as persona_agent_response
import auth

load_dotenv()
from celery_config import celery_app
from celery_worker import schedule_post_task
from websocket_manager import manager as connection_manager 


async def redis_listener(pubsub, db: Database):
    """Listens for messages from Redis and broadcasts them via WebSocket."""
    await pubsub.subscribe("task_updates")
    while True:
        try:
            message = await pubsub.get_message(ignore_subscribe_messages=True)
            if not (message and message["type"] == "message"):
                continue
            print(f"Received message from Redis: {message['data']}")
            data = json.loads(message["data"].decode("utf-8"))
            message_id = data["message_id"]
            status = data["status"]
            
            final_update_data = {}
            if status == "posted":
                final_update_data = {
                        "$set": {"schedule_status": "posted"},
                        "$unset": {"scheduled_time": "", "task_id": ""}
                }
            elif status == "failed":
                final_update_data = {"$set": {"schedule_status": "failed"}}
            if final_update_data:
                final_doc = db.messages.find_one_and_update(
                    {"_id": ObjectId(message_id)},
                    final_update_data,
                    return_document=ReturnDocument.AFTER
                )
                if final_doc:
                    await connection_manager.broadcast(Message(**final_doc).model_dump_json())
        except Exception as e:
            print(f"Error in Redis listener: {e}")
            await asyncio.sleep(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await startup_db_client(app)
    db = app.mongodb
    redis_client = aioredis.from_url("redis://localhost:6379", decode_responses=False)
    pubsub = redis_client.pubsub()
    listener_task = asyncio.create_task(redis_listener(pubsub, db))
    print("Redis listener started.")
    yield
    listener_task.cancel()
    await pubsub.close()
    await redis_client.close()
    await shutdown_db_client(app)
    print("Redis listener stopped.")

async def startup_db_client(app: FastAPI):
    app.mongodb_client = MongoClient(os.getenv("MONGO_URI"))
    app.mongodb = app.mongodb_client['hacks']
    print("MongoDB connected.")

async def shutdown_db_client(app: FastAPI):
    app.mongodb_client.close()
    print("Database disconnected.")

# This is a Pydantic v2 helper to validate MongoDB's ObjectId
# It converts the ObjectId to a string for JSON serialization
PyObjectId = Annotated[str, BeforeValidator(str)]

class ScheduleRequest(BaseModel):
    message_id: str
    start_date: datetime # The frontend should send this in ISO format

class User(BaseModel):
    username: str

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    password: str

Sender = Literal['user', 'bot']
ScheduleStatus = Literal['unscheduled', 'scheduled', 'posted', 'failed']

class MessageBase(BaseModel):
    text: str
    username: str
    sender: Sender
    persona_name: str
    
class Message(MessageBase):
    """
    Represents a chat message.
    """
    id: PyObjectId = Field(alias="_id")
    schedule_status: ScheduleStatus = Field(default='unscheduled')
    scheduled_time: datetime | None = None
    task_id: str | None = None
    
    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str}
    
class ChatRequest(BaseModel):
    last_user_message: Message
    persona_name: str
class ChatHistory(BaseModel):
    messages: List[Message]
    

class NostrPost(BaseModel):
    content: str
    
class PersonaGenerateRequest(BaseModel):
    sample_post: str

class PersonaBase(BaseModel):
    """The base model containing all fields a user can define for a persona."""
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., gt=0, description="The persona's age in years.")
    role: str = Field(..., max_length=200)
    style: str = Field(..., max_length=200)
    domain_knowledge: List[str] = Field(default_factory=list)
    quirks: str = Field(default="", max_length=500)
    bio: str = Field(default="", max_length=2000)
    lore: str = Field(default="", max_length=2000)
    personality: str = Field(default="", max_length=500)
    conversation_style: str = Field(default="", max_length=500)

    # Personality traits with validation to keep them between 0.0 and 1.0
    emotional_stability: float = Field(..., ge=0.0, le=1.0)
    friendliness: float = Field(..., ge=0.0, le=1.0)
    creativity: float = Field(..., ge=0.0, le=1.0)
    curiosity: float = Field(..., ge=0.0, le=1.0)
    formality: float = Field(..., ge=0.0, le=1.0)
    empathy: float = Field(..., ge=0.0, le=1.0)
    humor: float = Field(..., ge=0.0, le=1.0)


class PersonaCreate(PersonaBase):
    """Model used for creating a persona. Inherits all fields from base."""
    pass


class Persona(PersonaBase):
    """The full persona model, including database-generated fields, for API responses."""
    id: PyObjectId = Field(alias="_id")
    creator_id: str

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str}


class PersonaUpdate(BaseModel):
    """
    An update model where every single field is optional.
    This allows for flexible PATCH-style updates.
    """
    name: str | None = Field(default=None, min_length=1, max_length=100)
    age: int | None = Field(default=None, gt=0)
    role: str | None = Field(default=None, max_length=200)
    style: str | None = Field(default=None, max_length=200)
    domain_knowledge: List[str] | None = None
    quirks: str | None = Field(default=None, max_length=500)
    bio: str | None = Field(default=None, max_length=2000)
    lore: str | None = Field(default=None, max_length=2000)
    personality: str | None = Field(default=None, max_length=500)
    conversation_style: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=1000)

    emotional_stability: float | None = Field(default=None, ge=0.0, le=1.0)
    friendliness: float | None = Field(default=None, ge=0.0, le=1.0)
    creativity: float | None = Field(default=None, ge=0.0, le=1.0)
    curiosity: float | None = Field(default=None, ge=0.0, le=1.0)
    formality: float | None = Field(default=None, ge=0.0, le=1.0)
    empathy: float | None = Field(default=None, ge=0.0, le=1.0)
    humor: float | None = Field(default=None, ge=0.0, le=1.0)

# --- FastAPI App ---
app = FastAPI(lifespan=lifespan)

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency for DB Access ---
def get_database(request: Request) -> Database:
    return request.app.mongodb

# --- Authentication Endpoints ---

@app.post("/api/token", response_model=auth.Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Database, Depends(get_database)]
):
    """
    Exchanges username and password for a JWT access token.
    """
    user_dict = db.users.find_one({"username": form_data.username})
    if not user_dict or not auth.verify_password(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = UserInDB(**user_dict)

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate, 
    db: Annotated[Database, Depends(get_database)]
):
    """
    Creates a new user in the database.
    """
    existing_user = db.users.find_one({"username": user_in.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = auth.get_password_hash(user_in.password)
    user_db = UserInDB(
        username=user_in.username,
        hashed_password=hashed_password,
    )
    
    db.users.insert_one(user_db.model_dump())
    
    # Return the created user (without the password)
    return User(**user_db.model_dump())

# --- Protected Endpoints ---

# We need to pass the db dependency to get_current_user now
async def get_current_user_dependency(
    token: Annotated[str, Depends(auth.oauth2_scheme)], 
    db: Annotated[Database, Depends(get_database)]
):
    return await auth.get_current_user(token, db)


@app.get("/api/users/me", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_user_dependency)]
):
    """
    Returns the data for the currently authenticated user.
    """
    return current_user


@app.post("/api/personas", response_model=Persona, status_code=status.HTTP_201_CREATED)
async def create_persona(
    persona_in: PersonaCreate,
    current_user: Annotated[User, Depends(get_current_user_dependency)],
    db: Annotated[Database, Depends(get_database)],
):
    """
    Create a new persona. The creator_id is automatically set to the
    currently authenticated user's username.
    """
    persona_doc = persona_in.model_dump()
    persona_doc["creator_id"] = current_user.username

    result = db.personas.insert_one(persona_doc)

    created_persona = db.personas.find_one({"_id": result.inserted_id})
    
    return created_persona


@app.get("/api/personas", response_model=List[Persona])
async def list_personas(
    current_user: Annotated[User, Depends(get_current_user_dependency)],
    db: Annotated[Database, Depends(get_database)],
):
    """
    Retrieve all personas created by the currently authenticated user.
    """
    personas = list(db.personas.find({"creator_id": current_user.username}))
    return personas


# non idiomatic but one user can have one persona of that name, so
@app.get("/api/personas/{persona_name}", response_model=Persona)
async def get_persona(
    persona_name: str,
    current_user: Annotated[User, Depends(get_current_user_dependency)],
    db: Annotated[Database, Depends(get_database)],
):
    """
    Retrieve a single persona by its ID.
    Access is restricted to the persona's creator.
    """
    try:
        persona = db.personas.find_one({
            "name": persona_name,
            "creator_id": current_user.username
        })
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid persona ID format.")

    if persona is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona not found.")
    
    return persona


@app.put("/api/personas/{persona_name}", response_model=Persona)
async def update_persona(
    persona_name: str,
    persona_update: PersonaUpdate,
    current_user: Annotated[User, Depends(get_current_user_dependency)],
    db: Annotated[Database, Depends(get_database)],
):
    """
    Update a persona's details.
    Only the creator of the persona can update it.
    """
    update_data = persona_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided.")
    
    try:
        updated_persona = db.personas.find_one_and_update(
            {"_id": persona_name, "creator_id": current_user.username},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER
        )
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid persona ID format.")

    if updated_persona is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona not found or you don't have permission to update it.")

    return updated_persona


@app.delete("/api/personas/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_persona(
    persona_id: str,
    current_user: Annotated[User, Depends(get_current_user_dependency)],
    db: Annotated[Database, Depends(get_database)],
):
    """
    Delete a persona by its ID.
    Only the creator of the persona can delete it.
    """
    try:
        result = db.personas.delete_one({
            "_id": ObjectId(persona_id),
            "creator_id": current_user.username
        })
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid persona ID format.")

    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona not found or you don't have permission to delete it.")

    return None


@app.post("/api/chat", response_model=Message)
async def chat(
    request: ChatRequest,  # Use the new model here
    current_user: Annotated[User, Depends(get_current_user_dependency)],
    db: Annotated[Database, Depends(get_database)], # This line protects the endpoint
) -> Message:
    print(f"Chat request from user: {current_user.username}") # You can now see who is chatting
    
    # get the current persona
    persona_name = request.persona_name
    last_user_message = request.last_user_message
    persona = db.personas.find_one({
            "name": persona_name,
            "creator_id": current_user.username
    })

    text_response = await content_agent_response(last_user_message, persona)
    #go through the text of the message and find any instances of </think>. Find the last instance of </think> and replace the word
    #with the portion after this tag
    if "</think>" in text_response:
        last_think_idx = text_response.rfind("</think>")
        text_response = text_response[last_think_idx + len("</think>") :]
        text_response = text_response.lstrip()
    bot_response = MessageBase(
        text=text_response,
        sender='bot',
        username=current_user.username,
        persona_name=persona_name
    )

    
    result = db.messages.insert_one(bot_response.model_dump())
    generated_message = db.messages.find_one({"_id": result.inserted_id})
    
    return generated_message

@app.get("/api/messages", response_model=List[Message])
async def list_messages(
    persona_name: str,
    current_user: Annotated[User, Depends(get_current_user_dependency)],
    db: Annotated[Database, Depends(get_database)],
):
    messages = list(db.messages.find({"username": current_user.username, "persona_name": persona_name, "sender": "bot"}))
    return messages
    
@app.post("/api/personas/generate", response_model=PersonaCreate)
async def generate_persona(
    persona_request: PersonaGenerateRequest,
    current_user: Annotated[User, Depends(get_current_user_dependency)]
):
    if not persona_request.sample_post:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sample post is required.")

    # Call the persona agent to generate the persona
    persona_data = await persona_agent_response(persona_request.sample_post)

    # Create a Persona object from the generated data, don't save to DB as the user needs to verify it first
    persona_create = PersonaCreate(**persona_data, creator_id=current_user.username)
        
    return persona_create


@app.post("/api/nostr/post", status_code=status.HTTP_200_OK)
async def post_to_nostr(
    post: NostrPost,
    current_user: Annotated[User, Depends(get_current_user_dependency)],
):

    # Here you would implement the logic to post to Nostr
    # For now, we'll just simulate a successful post
    response = await post_to_nostr_util(post.content)
    print(response)
    
    return {"status": "success", "message": "Posted to Nostr successfully!"}


@app.post("/api/schedule")
async def schedule_post(req: ScheduleRequest,
                        current_user: Annotated[User, Depends(get_current_user_dependency)],
                        db: Annotated[Database, Depends(get_database)]):
    # Fetch message details from your database
    message_data = db.messages.find_one({"_id": ObjectId(req.message_id), "username": current_user.username})
    if not message_data:
        raise HTTPException(status_code=404, detail="Message not found")
    target_time_utc = req.start_date.replace(hour=9, minute=0, second=0, microsecond=0).astimezone(pytz.UTC)
    now_utc = datetime.now(pytz.UTC)
    task_id = f"post-task-{req.message_id}-{int(datetime.now().timestamp())}"
    if target_time_utc < now_utc:
        print(f"Executing immediately for message_id: {req.message_id}")
        task = schedule_post_task.apply_async(
            args=[req.message_id, message_data['text']],
            task_id=task_id,
        )
    else:
        print(f"Scheduling for future for message_id: {req.message_id} at {target_time_utc}")
        task = schedule_post_task.apply_async(
            args=[req.message_id, message_data['text']],
            task_id=task_id,
            eta=target_time_utc
        )
    updated_message = db.messages.find_one_and_update(
        {"_id": ObjectId(req.message_id)},
        {"$set": {
            "schedule_status": "scheduled",
            "scheduled_time": target_time_utc,
            "task_id": task_id
        }},
        return_document=ReturnDocument.AFTER
    )

    if not updated_message:
        celery_app.control.revoke(task_id, terminate=True)
        raise HTTPException(status_code=500, detail="Failed to update message state.")
    
    return Message(**updated_message)

@app.delete("/api/schedule/{task_id}")
async def unschedule_post(task_id: str,current_user: Annotated[User, Depends(get_current_user_dependency)], db: Annotated[Database, Depends(get_database)]):
    message_to_unschedule = db.messages.find_one({
        "task_id": task_id, 
        "username": current_user.username
    })

    if not message_to_unschedule:
        raise HTTPException(status_code=404, detail="Scheduled task not found or you don't have permission.")
    
    celery_app.control.revoke(task_id, terminate=True, signal='SIGKILL')
    
    updated_message = db.messages.find_one_and_update(
        {"_id": message_to_unschedule["_id"]},
        {
            "$set": {"schedule_status": "unscheduled"},
            "$unset": {"scheduled_time": "", "task_id": ""}
        },
        return_document=ReturnDocument.AFTER
    )

    return Message(**updated_message)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)