import os
import base64
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import uuid
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import logging

logger = logging.getLogger(__name__)

class WalletService:
    def __init__(self, db):
        self.db = db
        self.wallets_collection = db.wallets
        self.policies_collection = db.policies
        self.encryption_key = self._get_encryption_key()
        self.fernet = Fernet(self.encryption_key)
    
    def _get_encryption_key(self) -> bytes:
        passphrase = os.environ.get('WALLET_PASSPHRASE', 'default-dev-passphrase-change-in-prod')
        salt = b'solana-agentic-wallet-salt'
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))
        return key
    
    async def create_wallet(
        self,
        name: str,
        key_management_type: str = "encrypted"
    ) -> Dict[str, Any]:
        keypair = Keypair()
        pubkey = str(keypair.pubkey())
        
        if key_management_type == "encrypted":
            private_key_bytes = bytes(keypair)
            encrypted_key = self.fernet.encrypt(private_key_bytes)
            stored_key = base64.b64encode(encrypted_key).decode()
        else:
            stored_key = base64.b64encode(bytes(keypair)).decode()
        
        wallet_id = str(uuid.uuid4())
        wallet_doc = {
            "wallet_id": wallet_id,
            "name": name,
            "pubkey": pubkey,
            "encrypted_private_key": stored_key,
            "key_management_type": key_management_type,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await self.wallets_collection.insert_one(wallet_doc)
        
        default_policy = {
            "wallet_id": wallet_id,
            "max_daily_spend": float(os.environ.get('MAX_DAILY_SOL_SPEND', 10)),
            "allowed_actions": ["transfer", "swap", "airdrop"],
            "require_simulation": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await self.policies_collection.insert_one(default_policy)
        
        return {
            "wallet_id": wallet_id,
            "name": name,
            "pubkey": pubkey,
            "key_management_type": key_management_type,
            "created_at": wallet_doc["created_at"]
        }
    
    async def get_wallet(self, wallet_id: str) -> Optional[Dict[str, Any]]:
        wallet = await self.wallets_collection.find_one(
            {"wallet_id": wallet_id},
            {"_id": 0}
        )
        if wallet:
            wallet.pop("encrypted_private_key", None)
        return wallet
    
    async def get_all_wallets(self) -> List[Dict[str, Any]]:
        wallets = await self.wallets_collection.find(
            {},
            {"_id": 0, "encrypted_private_key": 0}
        ).to_list(1000)
        return wallets
    
    async def get_keypair(self, wallet_id: str) -> Keypair:
        wallet = await self.wallets_collection.find_one(
            {"wallet_id": wallet_id},
            {"_id": 0}
        )
        
        if not wallet:
            raise ValueError(f"Wallet {wallet_id} not found")
        
        stored_key = wallet["encrypted_private_key"]
        key_bytes = base64.b64decode(stored_key)
        
        if wallet["key_management_type"] == "encrypted":
            decrypted = self.fernet.decrypt(key_bytes)
            keypair = Keypair.from_bytes(decrypted)
        else:
            keypair = Keypair.from_bytes(key_bytes)
        
        return keypair
    
    async def update_policy(
        self,
        wallet_id: str,
        max_daily_spend: Optional[float] = None,
        allowed_actions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        update_fields = {}
        if max_daily_spend is not None:
            update_fields["max_daily_spend"] = max_daily_spend
        if allowed_actions is not None:
            update_fields["allowed_actions"] = allowed_actions
        
        if update_fields:
            await self.policies_collection.update_one(
                {"wallet_id": wallet_id},
                {"$set": update_fields}
            )
        
        return await self.get_policy(wallet_id)
    
    async def get_policy(self, wallet_id: str) -> Optional[Dict[str, Any]]:
        policy = await self.policies_collection.find_one(
            {"wallet_id": wallet_id},
            {"_id": 0}
        )
        return policy