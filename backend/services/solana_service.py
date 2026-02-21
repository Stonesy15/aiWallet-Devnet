import os
import asyncio
from typing import Dict, Any, Optional
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.transaction import Transaction
from solders.message import Message
import logging

logger = logging.getLogger(__name__)

class SolanaService:
    def __init__(self):
        network = os.environ.get('SOLANA_NETWORK', 'devnet')
        if network == 'devnet':
            self.rpc_url = "https://api.devnet.solana.com"
        elif network == 'testnet':
            self.rpc_url = "https://api.testnet.solana.com"
        else:
            self.rpc_url = "https://api.mainnet-beta.solana.com"
        
        self.client = AsyncClient(self.rpc_url)
        self.network = network
    
    async def get_balance(self, pubkey_str: str) -> float:
        try:
            pubkey = Pubkey.from_string(pubkey_str)
            response = await self.client.get_balance(pubkey, commitment=Confirmed)
            if response.value is not None:
                return response.value / 1_000_000_000
            return 0.0
        except Exception as e:
            logger.error(f"Error getting balance: {e}")
            return 0.0
    
    async def request_airdrop(self, pubkey_str: str, amount_sol: float = 1.0) -> Dict[str, Any]:
        try:
            pubkey = Pubkey.from_string(pubkey_str)
            lamports = int(amount_sol * 1_000_000_000)
            
            response = await self.client.request_airdrop(pubkey, lamports, commitment=Confirmed)
            
            if response.value:
                signature = str(response.value)
                await self.client.confirm_transaction(response.value, commitment=Confirmed)
                
                return {
                    "success": True,
                    "signature": signature,
                    "amount": amount_sol,
                    "explorer_url": f"https://explorer.solana.com/tx/{signature}?cluster={self.network}"
                }
            else:
                return {"success": False, "error": "Airdrop failed"}
        except Exception as e:
            logger.error(f"Airdrop error: {e}")
            return {"success": False, "error": str(e)}
    
    async def simulate_transfer(
        self,
        from_pubkey_str: str,
        to_pubkey_str: str,
        amount_sol: float
    ) -> Dict[str, Any]:
        try:
            from_balance = await self.get_balance(from_pubkey_str)
            
            if from_balance < amount_sol:
                return {
                    "valid": False,
                    "reason": "Insufficient balance",
                    "current_balance": from_balance,
                    "required": amount_sol
                }
            
            return {
                "valid": True,
                "from": from_pubkey_str,
                "to": to_pubkey_str,
                "amount": amount_sol,
                "estimated_fee": 0.000005,
                "final_balance": from_balance - amount_sol - 0.000005
            }
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            return {"valid": False, "reason": str(e)}
    
    async def transfer_sol(
        self,
        from_keypair: Keypair,
        to_pubkey_str: str,
        amount_sol: float
    ) -> Dict[str, Any]:
        try:
            to_pubkey = Pubkey.from_string(to_pubkey_str)
            lamports = int(amount_sol * 1_000_000_000)
            
            transfer_ix = transfer(
                TransferParams(
                    from_pubkey=from_keypair.pubkey(),
                    to_pubkey=to_pubkey,
                    lamports=lamports
                )
            )
            
            recent_blockhash = await self.client.get_latest_blockhash(commitment=Confirmed)
            
            message = Message.new_with_blockhash(
                [transfer_ix],
                from_keypair.pubkey(),
                recent_blockhash.value.blockhash
            )
            
            txn = Transaction([from_keypair], message, recent_blockhash.value.blockhash)
            
            response = await self.client.send_transaction(txn, from_keypair)
            
            if response.value:
                signature = str(response.value)
                await self.client.confirm_transaction(response.value, commitment=Confirmed)
                
                return {
                    "success": True,
                    "signature": signature,
                    "from": str(from_keypair.pubkey()),
                    "to": to_pubkey_str,
                    "amount": amount_sol,
                    "explorer_url": f"https://explorer.solana.com/tx/{signature}?cluster={self.network}"
                }
            else:
                return {"success": False, "error": "Transaction failed"}
        except Exception as e:
            logger.error(f"Transfer error: {e}")
            return {"success": False, "error": str(e)}
    
    async def close(self):
        await self.client.close()