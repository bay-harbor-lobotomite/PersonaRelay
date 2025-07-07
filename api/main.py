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

class ChatHistory(BaseModel):
    messages: List[Message]
    
# This is a Pydantic v2 helper to validate MongoDB's ObjectId
# It converts the ObjectId to a string for JSON serialization
PyObjectId = Annotated[str, BeforeValidator(str)]

class PersonaBase(BaseModel):
    """Base model with common fields."""
    name: str = Field(..., min_length=1, max_length=100)

class PersonaCreate(PersonaBase):
    """Model for creating a new persona. User only provides the name."""
    pass

class PersonaUpdate(BaseModel):
    """Model for updating a persona. All fields are optional for PATCH-like behavior."""
    name: str | None = Field(default=None, min_length=1, max_length=100)

class Persona(PersonaBase):
    """Model for representing a persona in the database and API responses."""
    # Use PyObjectId to handle the conversion from MongoDB's _id
    id: PyObjectId = Field(alias="_id", default=None)
    creator_id: str

    class Config:
        # This allows Pydantic to populate the model from an object (like a dict from MongoDB)
        # even if it's not a dictionary, and to use the 'alias' (_id) correctly.
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str} # Fallback for older Pydantic versions

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

@app.post("/api/chat", response_model=Message)
async def chat(
    history: ChatHistory,
    current_user: Annotated[User, Depends(get_current_user_dependency)] # This line protects the endpoint
) -> Message:
    """
    Receives the entire chat history and returns a new bot message.
    Requires user to be authenticated.
    """
    print(f"Chat request from user: {current_user.username}") # You can now see who is chatting
    
    last_user_message = "No message found."
    if history.messages and history.messages[-1].sender == 'user':
        last_user_message = history.messages[-1].text

    text_response = await get_agent_response(last_user_message)

    bot_response = Message(
        text=text_response,
        sender='bot'
    )
    
    return bot_response



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