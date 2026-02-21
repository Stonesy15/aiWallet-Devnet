#!/usr/bin/env python3
import asyncio
import os
import sys
sys.path.append('/app/backend')

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from motor.motor_asyncio import AsyncIOMotorClient
from services.wallet_service import WalletService
from services.agent_service import AgentService
from services.solana_service import SolanaService
from services.audit_service import AuditService

async def main():
    print("\n" + "="*60)
    print("  AGENTIC WALLET DEMO - Solana Devnet")
    print("="*60 + "\n")
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    wallet_service = WalletService(db)
    agent_service = AgentService(db, wallet_service)
    solana_service = SolanaService()
    audit_service = AuditService(db)
    
    print("[1] Creating wallets with different key management...")
    
    wallet1 = await wallet_service.create_wallet(
        "Agent-Wallet-Encrypted",
        "encrypted"
    )
    print(f"  ✓ Created encrypted wallet: {wallet1['pubkey']}")
    
    wallet2 = await wallet_service.create_wallet(
        "Agent-Wallet-Ephemeral",
        "ephemeral"
    )
    print(f"  ✓ Created ephemeral wallet: {wallet2['pubkey']}")
    
    print("\n[2] Funding wallets via devnet airdrop...")
    
    airdrop1 = await solana_service.request_airdrop(wallet1['pubkey'], 2.0)
    if airdrop1['success']:
        print(f"  ✓ Funded wallet 1: {airdrop1['explorer_url']}")
    else:
        print(f"  ✗ Airdrop failed: {airdrop1.get('error')}")
    
    await asyncio.sleep(2)
    
    airdrop2 = await solana_service.request_airdrop(wallet2['pubkey'], 1.5)
    if airdrop2['success']:
        print(f"  ✓ Funded wallet 2: {airdrop2['explorer_url']}")
    
    print("\n[3] Checking balances...")
    balance1 = await solana_service.get_balance(wallet1['pubkey'])
    balance2 = await solana_service.get_balance(wallet2['pubkey'])
    print(f"  Wallet 1 Balance: {balance1} SOL")
    print(f"  Wallet 2 Balance: {balance2} SOL")
    
    print("\n[4] Creating AI agents...")
    
    agent1 = await agent_service.create_agent(
        "Rule-Based-Agent",
        "rule-based",
        wallet1['wallet_id'],
        {
            "max_transaction_amount": 0.5,
            "auto_approve_below": 0.1,
            "require_simulation": True
        }
    )
    print(f"  ✓ Created rule-based agent: {agent1['agent_id']}")
    
    agent2 = await agent_service.create_agent(
        "LLM-Driven-Agent",
        "llm-driven",
        wallet2['wallet_id']
    )
    print(f"  ✓ Created LLM-driven agent: {agent2['agent_id']}")
    
    print("\n[5] Simulating transfer...")
    simulation = await solana_service.simulate_transfer(
        wallet1['pubkey'],
        wallet2['pubkey'],
        0.05
    )
    print(f"  Simulation valid: {simulation['valid']}")
    if simulation['valid']:
        print(f"  Estimated fee: {simulation['estimated_fee']} SOL")
    
    print("\n[6] Agent decision-making test...")
    
    decision1 = await agent_service.execute_action(
        agent1['agent_id'],
        "transfer",
        {"to": wallet2['pubkey'], "amount": 0.05}
    )
    print(f"  Rule-based decision: {decision1['approved']} - {decision1.get('reason', 'Approved')}")
    
    if decision1['approved']:
        print("\n[7] Executing approved transfer...")
        keypair1 = await wallet_service.get_keypair(wallet1['wallet_id'])
        transfer_result = await solana_service.transfer_sol(
            keypair1,
            wallet2['pubkey'],
            0.05
        )
        
        if transfer_result['success']:
            print(f"  ✓ Transfer successful!")
            print(f"  Signature: {transfer_result['signature']}")
            print(f"  Explorer: {transfer_result['explorer_url']}")
            
            await audit_service.log_action(
                wallet1['wallet_id'],
                "transfer",
                {"to": wallet2['pubkey'], "amount": 0.05},
                transfer_result
            )
        else:
            print(f"  ✗ Transfer failed: {transfer_result.get('error')}")
    
    print("\n[8] Final balances...")
    final_balance1 = await solana_service.get_balance(wallet1['pubkey'])
    final_balance2 = await solana_service.get_balance(wallet2['pubkey'])
    print(f"  Wallet 1: {final_balance1} SOL")
    print(f"  Wallet 2: {final_balance2} SOL")
    
    print("\n[9] Audit trail...")
    logs = await audit_service.get_logs(limit=5)
    for log in logs:
        print(f"  {log['timestamp'][:19]} | {log['action_type']} | Success: {log['success']}")
    
    print("\n" + "="*60)
    print("  DEMO COMPLETE")
    print("="*60 + "\n")
    
    await solana_service.close()
    client.close()

if __name__ == "__main__":
    asyncio.run(main())