#!/usr/bin/env python3
import asyncio
import sys
import os
import json
import typer
from typing import Optional

sys.path.append('/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from motor.motor_asyncio import AsyncIOMotorClient
from services.wallet_service import WalletService
from services.agent_service import AgentService
from services.solana_service import SolanaService
from services.audit_service import AuditService

app = typer.Typer()

def get_services():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    return (
        WalletService(db),
        AgentService(db, WalletService(db)),
        SolanaService(),
        AuditService(db),
        client
    )

@app.command()
def create_wallet(name: str, key_type: str = "encrypted"):
    """Create a new wallet"""
    async def _create():
        wallet_service, _, _, _, client = get_services()
        wallet = await wallet_service.create_wallet(name, key_type)
        print(json.dumps(wallet, indent=2))
        client.close()
    
    asyncio.run(_create())

@app.command()
def list_wallets():
    """List all wallets"""
    async def _list():
        wallet_service, _, solana_service, _, client = get_services()
        wallets = await wallet_service.get_all_wallets()
        
        for wallet in wallets:
            balance = await solana_service.get_balance(wallet['pubkey'])
            wallet['balance'] = balance
        
        print(json.dumps(wallets, indent=2))
        await solana_service.close()
        client.close()
    
    asyncio.run(_list())

@app.command()
def fund_wallet(pubkey: str, amount: float = 1.0):
    """Request airdrop for a wallet"""
    async def _fund():
        _, _, solana_service, _, client = get_services()
        result = await solana_service.request_airdrop(pubkey, amount)
        print(json.dumps(result, indent=2))
        await solana_service.close()
        client.close()
    
    asyncio.run(_fund())

@app.command()
def create_agent(name: str, agent_type: str, wallet_id: str):
    """Create a new AI agent"""
    async def _create():
        _, agent_service, _, _, client = get_services()
        agent = await agent_service.create_agent(name, agent_type, wallet_id)
        print(json.dumps(agent, indent=2))
        client.close()
    
    asyncio.run(_create())

@app.command()
def list_agents():
    """List all agents"""
    async def _list():
        _, agent_service, _, _, client = get_services()
        agents = await agent_service.get_all_agents()
        print(json.dumps(agents, indent=2))
        client.close()
    
    asyncio.run(_list())

@app.command()
def get_balance(pubkey: str):
    """Get wallet balance"""
    async def _balance():
        _, _, solana_service, _, client = get_services()
        balance = await solana_service.get_balance(pubkey)
        print(f"{balance} SOL")
        await solana_service.close()
        client.close()
    
    asyncio.run(_balance())

@app.command()
def audit_logs(wallet_id: Optional[str] = None, limit: int = 20):
    """View audit logs"""
    async def _logs():
        _, _, _, audit_service, client = get_services()
        logs = await audit_service.get_logs(wallet_id, limit)
        print(json.dumps(logs, indent=2))
        client.close()
    
    asyncio.run(_logs())

if __name__ == "__main__":
    app()