import time
import uuid
from datetime import timedelta
from typing import List, Literal, Annotated
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, BeforeValidator
from pymongo import MongoClient
from pymongo.database import Database
from contextlib import asynccontextmanager
from nostr_utils import post_to_nostr_util
from dotenv import load_dotenv
import os

from agent import get_agent_response
import auth

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await startup_db_client(app)
    yield
    await shutdown_db_client(app)

async def startup_db_client(app: FastAPI):
    app.mongodb_client = MongoClient(os.getenv("MONGO_URI"))
    app.mongodb = app.mongodb_client['hacks']
    print("MongoDB connected.")

async def shutdown_db_client(app: FastAPI):
    app.mongodb_client.close()
    print("Database disconnected.")

class User(BaseModel):
    username: str

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    password: str

Sender = Literal['user', 'bot']

class Message(BaseModel):
    id: int = Field(default_factory=lambda: uuid.uuid4().int)
    text: str
    sender: Sender
    
class ChatRequest(BaseModel):
    last_user_message: Message
    persona_name: str
class ChatHistory(BaseModel):
    messages: List[Message]
    
# This is a Pydantic v2 helper to validate MongoDB's ObjectId
# It converts the ObjectId to a string for JSON serialization
PyObjectId = Annotated[str, BeforeValidator(str)]

class NostrPost(BaseModel):
    content: str

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
    description: str = Field(default="", max_length=1000)

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
    """
    Receives a prompt
    Requires user to be authenticated.
    """
    print(f"Chat request from user: {current_user.username}") # You can now see who is chatting
    
    # get the current persona
    persona_name = request.persona_name
    last_user_message = request.last_user_message
    persona = db.personas.find_one({
            "name": persona_name,
            "creator_id": current_user.username
    })

    text_response = await get_agent_response(last_user_message, persona)
    bot_response = Message(
        text=text_response,
        sender='bot'
    )
    
    return bot_response


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