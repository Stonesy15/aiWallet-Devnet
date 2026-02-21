from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

class AuditService:
    def __init__(self, db):
        self.db = db
        self.audit_collection = db.audit_logs
    
    async def log_action(
        self,
        wallet_id: str,
        action_type: str,
        params: Dict[str, Any],
        result: Dict[str, Any]
    ) -> None:
        log_entry = {
            "wallet_id": wallet_id,
            "action_type": action_type,
            "params": params,
            "result": result,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "success": result.get("success", False)
        }
        
        await self.audit_collection.insert_one(log_entry)
        logger.info(f"Audit log created: {action_type} for wallet {wallet_id}")
    
    async def get_logs(
        self,
        wallet_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        query = {"wallet_id": wallet_id} if wallet_id else {}
        
        logs = await self.audit_collection.find(
            query,
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return logs