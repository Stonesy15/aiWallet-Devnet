import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class AgentService:
    def __init__(self, db, wallet_service):
        self.db = db
        self.wallet_service = wallet_service
        self.agents_collection = db.agents
        self.agent_logs_collection = db.agent_logs
        self.llm_key = os.environ.get('EMERGENT_LLM_KEY')
    
    async def create_agent(
        self,
        name: str,
        agent_type: str,
        wallet_id: str,
        policy: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        wallet = await self.wallet_service.get_wallet(wallet_id)
        if not wallet:
            raise ValueError(f"Wallet {wallet_id} not found")
        
        agent_id = str(uuid.uuid4())
        default_policy = {
            "max_transaction_amount": 0.5,
            "auto_approve_below": 0.1,
            "require_simulation": True
        }
        
        agent_doc = {
            "agent_id": agent_id,
            "name": name,
            "agent_type": agent_type,
            "wallet_id": wallet_id,
            "policy": policy or default_policy,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await self.agents_collection.insert_one(agent_doc)
        
        return {
            "agent_id": agent_id,
            "name": name,
            "agent_type": agent_type,
            "wallet_id": wallet_id,
            "status": "active",
            "created_at": agent_doc["created_at"]
        }
    
    async def get_all_agents(self) -> List[Dict[str, Any]]:
        agents = await self.agents_collection.find(
            {},
            {"_id": 0}
        ).to_list(1000)
        return agents
    
    async def execute_action(
        self,
        agent_id: str,
        action_type: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        agent = await self.agents_collection.find_one(
            {"agent_id": agent_id},
            {"_id": 0}
        )
        
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        
        decision_log = {
            "agent_id": agent_id,
            "action_type": action_type,
            "params": params,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        if agent["agent_type"] == "rule-based":
            result = await self._execute_rule_based(agent, action_type, params)
        else:
            result = await self._execute_llm_driven(agent, action_type, params)
        
        decision_log["result"] = result
        await self.agent_logs_collection.insert_one(decision_log)
        
        return result
    
    async def _execute_rule_based(
        self,
        agent: Dict[str, Any],
        action_type: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        policy = agent["policy"]
        
        if action_type == "transfer":
            amount = params.get("amount", 0)
            
            if amount > policy["max_transaction_amount"]:
                return {
                    "approved": False,
                    "reason": f"Amount {amount} exceeds policy limit {policy['max_transaction_amount']}",
                    "decision_type": "rule-based"
                }
            
            return {
                "approved": True,
                "action": "transfer",
                "params": params,
                "decision_type": "rule-based",
                "auto_execute": amount <= policy["auto_approve_below"]
            }
        
        elif action_type == "swap":
            amount = params.get("amount", 0)
            
            if amount > policy["max_transaction_amount"]:
                return {
                    "approved": False,
                    "reason": f"Swap amount {amount} exceeds policy limit",
                    "decision_type": "rule-based"
                }
            
            return {
                "approved": True,
                "action": "swap",
                "params": params,
                "decision_type": "rule-based",
                "auto_execute": amount <= policy["auto_approve_below"]
            }
        
        return {"approved": True, "decision_type": "rule-based"}
    
    async def _execute_llm_driven(
        self,
        agent: Dict[str, Any],
        action_type: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        try:
            chat = LlmChat(
                api_key=self.llm_key,
                session_id=f"agent-{agent['agent_id']}",
                system_message="""You are an AI agent managing a Solana wallet. 
                Analyze the requested action and decide whether to approve it based on:
                1. Transaction safety
                2. Amount reasonableness
                3. Policy compliance
                
                Respond in JSON format:
                {
                    "approved": true/false,
                    "reason": "explanation",
                    "risk_level": "low/medium/high"
                }"""
            )
            
            chat.with_model("openai", "gpt-5.2")
            
            prompt = f"""Action Type: {action_type}
Parameters: {params}
Policy: {agent['policy']}

Should this action be approved?"""
            
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            
            import json
            try:
                decision = json.loads(response)
            except:
                decision = {
                    "approved": False,
                    "reason": "Failed to parse LLM response",
                    "risk_level": "high"
                }
            
            decision["decision_type"] = "llm-driven"
            decision["llm_response"] = response
            
            return decision
        except Exception as e:
            logger.error(f"LLM decision error: {e}")
            return {
                "approved": False,
                "reason": f"LLM error: {str(e)}",
                "decision_type": "llm-driven",
                "error": True
            }