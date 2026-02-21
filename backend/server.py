from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from services.wallet_service import WalletService
from services.agent_service import AgentService
from services.solana_service import SolanaService
from services.audit_service import AuditService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

wallet_service = WalletService(db)
agent_service = AgentService(db, wallet_service)
solana_service = SolanaService()
audit_service = AuditService(db)

class WalletCreateRequest(BaseModel):
    name: str
    key_management_type: str = "encrypted"  # encrypted or ephemeral

class WalletResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    wallet_id: str
    name: str
    pubkey: str
    key_management_type: str
    created_at: str
    balances: Optional[Dict[str, Any]] = None

class AgentCreateRequest(BaseModel):
    name: str
    agent_type: str  # rule-based or llm-driven
    wallet_id: str
    policy: Optional[Dict[str, Any]] = None

class AgentExecuteRequest(BaseModel):
    agent_id: str
    action_type: str  # transfer, swap, etc.
    params: Dict[str, Any]

class TransactionRequest(BaseModel):
    wallet_id: str
    to_address: str
    amount: float
    simulate_only: bool = False

class PolicyUpdateRequest(BaseModel):
    wallet_id: str
    max_daily_spend: Optional[float] = None
    allowed_actions: Optional[List[str]] = None

@api_router.get("/")
async def root():
    return {"message": "Agentic Wallet API"}

@api_router.post("/wallets", response_model=WalletResponse)
async def create_wallet(request: WalletCreateRequest):
    try:
        wallet = await wallet_service.create_wallet(
            request.name,
            request.key_management_type
        )
        balance = await solana_service.get_balance(wallet["pubkey"])
        wallet["balances"] = {"SOL": balance}
        return WalletResponse(**wallet)
    except Exception as e:
        logging.error(f"Error creating wallet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/wallets", response_model=List[WalletResponse])
async def get_wallets():
    wallets = await wallet_service.get_all_wallets()
    for wallet in wallets:
        try:
            balance = await solana_service.get_balance(wallet["pubkey"])
            wallet["balances"] = {"SOL": balance}
        except:
            wallet["balances"] = {"SOL": 0}
    return wallets

@api_router.get("/wallets/{wallet_id}", response_model=WalletResponse)
async def get_wallet(wallet_id: str):
    wallet = await wallet_service.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    balance = await solana_service.get_balance(wallet["pubkey"])
    wallet["balances"] = {"SOL": balance}
    return WalletResponse(**wallet)

@api_router.post("/wallets/{wallet_id}/fund")
async def fund_wallet(wallet_id: str):
    wallet = await wallet_service.get_wallet(wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    result = await solana_service.request_airdrop(wallet["pubkey"])
    await audit_service.log_action(
        wallet_id,
        "airdrop",
        {"pubkey": wallet["pubkey"], "amount": 1},
        result
    )
    return result

@api_router.post("/transactions/transfer")
async def transfer_sol(request: TransactionRequest):
    wallet = await wallet_service.get_wallet(request.wallet_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if request.simulate_only:
        result = await solana_service.simulate_transfer(
            wallet["pubkey"],
            request.to_address,
            request.amount
        )
        return {"simulation": result, "executed": False}
    
    keypair = await wallet_service.get_keypair(request.wallet_id)
    result = await solana_service.transfer_sol(
        keypair,
        request.to_address,
        request.amount
    )
    
    await audit_service.log_action(
        request.wallet_id,
        "transfer",
        {"to": request.to_address, "amount": request.amount},
        result
    )
    
    return result

@api_router.post("/agents", response_model=Dict[str, Any])
async def create_agent(request: AgentCreateRequest):
    agent = await agent_service.create_agent(
        request.name,
        request.agent_type,
        request.wallet_id,
        request.policy
    )
    return agent

@api_router.get("/agents", response_model=List[Dict[str, Any]])
async def get_agents():
    return await agent_service.get_all_agents()

@api_router.post("/agents/execute")
async def execute_agent_action(request: AgentExecuteRequest):
    result = await agent_service.execute_action(
        request.agent_id,
        request.action_type,
        request.params
    )
    return result

@api_router.get("/audit/logs", response_model=List[Dict[str, Any]])
async def get_audit_logs(wallet_id: Optional[str] = None, limit: int = 100):
    return await audit_service.get_logs(wallet_id, limit)

@api_router.post("/policies")
async def update_policy(request: PolicyUpdateRequest):
    result = await wallet_service.update_policy(
        request.wallet_id,
        request.max_daily_spend,
        request.allowed_actions
    )
    return result

@api_router.get("/policies/{wallet_id}")
async def get_policy(wallet_id: str):
    policy = await wallet_service.get_policy(wallet_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()