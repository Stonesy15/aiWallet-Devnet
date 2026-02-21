import os
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import secrets
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db):
        self.db = db
        self.users_collection = db.users
        self.api_keys_collection = db.api_keys
        self.secret_key = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-prod')
        self.token_expiry_hours = 24
    
    async def register_user(
        self,
        username: str,
        email: str,
        password: str
    ) -> Dict[str, Any]:
        existing = await self.users_collection.find_one(
            {"$or": [{"username": username}, {"email": email}]},
            {"_id": 0}
        )
        
        if existing:
            raise ValueError("Username or email already exists")
        
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        
        user_id = str(uuid.uuid4())
        user_doc = {
            "user_id": user_id,
            "username": username,
            "email": email,
            "password_hash": password_hash.decode(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        
        await self.users_collection.insert_one(user_doc)
        
        token = self._generate_jwt(user_id, username)
        
        return {
            "user_id": user_id,
            "username": username,
            "email": email,
            "token": token
        }
    
    async def login(
        self,
        username: str,
        password: str
    ) -> Dict[str, Any]:
        user = await self.users_collection.find_one(
            {"username": username},
            {"_id": 0}
        )
        
        if not user:
            raise ValueError("Invalid credentials")
        
        if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
            raise ValueError("Invalid credentials")
        
        if not user.get("is_active", True):
            raise ValueError("Account is disabled")
        
        token = self._generate_jwt(user["user_id"], user["username"])
        
        return {
            "user_id": user["user_id"],
            "username": user["username"],
            "email": user["email"],
            "token": token
        }
    
    def _generate_jwt(self, user_id: str, username: str) -> str:
        payload = {
            "user_id": user_id,
            "username": username,
            "exp": datetime.now(timezone.utc) + timedelta(hours=self.token_expiry_hours),
            "iat": datetime.now(timezone.utc)
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm="HS256")
        return token
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")
    
    async def create_api_key(
        self,
        user_id: str,
        name: str,
        permissions: Optional[list] = None
    ) -> Dict[str, Any]:
        api_key = f"ak_{secrets.token_urlsafe(32)}"
        
        key_doc = {
            "key_id": str(uuid.uuid4()),
            "api_key": api_key,
            "user_id": user_id,
            "name": name,
            "permissions": permissions or ["read", "write"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_used": None,
            "is_active": True
        }
        
        await self.api_keys_collection.insert_one(key_doc)
        
        return {
            "key_id": key_doc["key_id"],
            "api_key": api_key,
            "name": name,
            "permissions": key_doc["permissions"]
        }
    
    async def verify_api_key(self, api_key: str) -> Dict[str, Any]:
        key_doc = await self.api_keys_collection.find_one(
            {"api_key": api_key, "is_active": True},
            {"_id": 0}
        )
        
        if not key_doc:
            raise ValueError("Invalid API key")
        
        await self.api_keys_collection.update_one(
            {"api_key": api_key},
            {"$set": {"last_used": datetime.now(timezone.utc).isoformat()}}
        )
        
        return key_doc
    
    async def list_api_keys(self, user_id: str) -> list:
        keys = await self.api_keys_collection.find(
            {"user_id": user_id},
            {"_id": 0, "api_key": 0}
        ).to_list(100)
        
        return keys
    
    async def revoke_api_key(self, key_id: str, user_id: str) -> bool:
        result = await self.api_keys_collection.update_one(
            {"key_id": key_id, "user_id": user_id},
            {"$set": {"is_active": False}}
        )
        
        return result.modified_count > 0