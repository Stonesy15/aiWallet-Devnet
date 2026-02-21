import os
import logging
from typing import Dict, Any, Optional
import httpx
from solders.keypair import Keypair
from solders.pubkey import Pubkey

logger = logging.getLogger(__name__)

class SwapService:
    def __init__(self):
        self.jupiter_api = "https://quote-api.jup.ag/v6"
        self.network = os.environ.get('SOLANA_NETWORK', 'devnet')
    
    async def get_quote(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 50
    ) -> Dict[str, Any]:
        """Get swap quote from Jupiter"""
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                params = {
                    "inputMint": input_mint,
                    "outputMint": output_mint,
                    "amount": amount,
                    "slippageBps": slippage_bps
                }
                
                response = await client.get(
                    f"{self.jupiter_api}/quote",
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "quote": data,
                        "input_amount": amount,
                        "output_amount": int(data.get("outAmount", 0)),
                        "price_impact": float(data.get("priceImpactPct", 0))
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Jupiter API error: {response.status_code}"
                    }
        except Exception as e:
            logger.error(f"Quote error: {e}")
            return {"success": False, "error": str(e)}
    
    async def simulate_swap(
        self,
        input_mint: str,
        output_mint: str,
        amount_in: float,
        token_decimals: int = 9
    ) -> Dict[str, Any]:
        """Simulate a token swap"""
        try:
            amount_lamports = int(amount_in * (10 ** token_decimals))
            
            quote_result = await self.get_quote(
                input_mint,
                output_mint,
                amount_lamports
            )
            
            if not quote_result["success"]:
                return quote_result
            
            output_amount = quote_result["output_amount"] / (10 ** token_decimals)
            
            return {
                "valid": True,
                "input_mint": input_mint,
                "output_mint": output_mint,
                "amount_in": amount_in,
                "amount_out": output_amount,
                "price_impact": quote_result["price_impact"],
                "quote": quote_result["quote"]
            }
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            return {"valid": False, "error": str(e)}
    
    async def execute_swap(
        self,
        keypair: Keypair,
        quote: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a swap using Jupiter API"""
        try:
            user_pubkey = str(keypair.pubkey())
            
            async with httpx.AsyncClient(timeout=30) as client:
                swap_request = {
                    "quoteResponse": quote,
                    "userPublicKey": user_pubkey,
                    "wrapUnwrapSOL": True,
                    "computeUnitPriceMicroLamports": 1000
                }
                
                response = await client.post(
                    f"{self.jupiter_api}/swap",
                    json=swap_request
                )
                
                if response.status_code == 200:
                    swap_data = response.json()
                    
                    return {
                        "success": True,
                        "swap_transaction": swap_data.get("swapTransaction"),
                        "message": "Swap transaction prepared (signing not implemented in devnet demo)"
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Swap API error: {response.status_code}"
                    }
        except Exception as e:
            logger.error(f"Swap execution error: {e}")
            return {"success": False, "error": str(e)}
    
    def get_common_tokens(self) -> Dict[str, str]:
        """Return common Solana token mints"""
        if self.network == "devnet":
            return {
                "SOL": "So11111111111111111111111111111111111111112",
                "USDC": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
                "USDT": "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS"
            }
        else:
            return {
                "SOL": "So11111111111111111111111111111111111111112",
                "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                "RAY": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
                "SRM": "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"
            }
    
    async def get_token_price(
        self,
        token_mint: str
    ) -> Dict[str, Any]:
        """Get token price from Jupiter"""
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    f"{self.jupiter_api}/price",
                    params={"ids": token_mint}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "price": data.get("data", {}).get(token_mint, {})
                    }
                else:
                    return {"success": False, "error": "Price not available"}
        except Exception as e:
            logger.error(f"Price fetch error: {e}")
            return {"success": False, "error": str(e)}