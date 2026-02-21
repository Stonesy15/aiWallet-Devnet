# SKILLS.md - Agent Command Reference

This document provides machine-readable and human-readable descriptions of all agent capabilities.

## Agent Capabilities Overview

The agentic wallet system supports programmatic operations through a well-defined API. All commands return structured JSON responses suitable for automated parsing.

---

## Wallet Operations

### `create_wallet(name: string, key_type: string) -> WalletResponse`

Create a new programmatic wallet.

**Parameters:**
- `name` (string, required): Human-readable wallet name
- `key_type` (string, optional): "encrypted" or "ephemeral" (default: "encrypted")

**Returns:**
```json
{
  "wallet_id": "uuid-string",
  "name": "My Wallet",
  "pubkey": "7xKz...9Abc",
  "key_management_type": "encrypted",
  "created_at": "2024-01-15T10:30:00Z",
  "balances": {"SOL": 0.0}
}
```

**Example:**
```bash
POST /api/wallets
{
  "name": "Agent Wallet 1",
  "key_management_type": "encrypted"
}
```

---

### `fund_wallet(wallet_id: string, amount_sol: float) -> TransactionResponse`

Request devnet airdrop for a wallet.

**Parameters:**
- `wallet_id` (string, required): Target wallet ID
- `amount_sol` (float, optional): Amount in SOL (default: 1.0, max: 2.0 per request)

**Returns:**
```json
{
  "success": true,
  "signature": "3Kx9...",
  "amount": 1.0,
  "explorer_url": "https://explorer.solana.com/tx/...?cluster=devnet"
}
```

**Example:**
```bash
POST /api/wallets/{wallet_id}/fund
```

---

### `get_balance(wallet_id: string) -> BalanceResponse`

Retrieve current wallet balance.

**Parameters:**
- `wallet_id` (string, required): Wallet ID

**Returns:**
```json
{
  "wallet_id": "uuid-string",
  "pubkey": "7xKz...9Abc",
  "balances": {
    "SOL": 1.5,
    "SPL": {}
  }
}
```

**Example:**
```bash
GET /api/wallets/{wallet_id}
```

---

## Agent Operations

### `create_agent(name: string, agent_type: string, wallet_id: string, policy: object) -> AgentResponse`

Create a new AI agent.

**Parameters:**
- `name` (string, required): Agent name
- `agent_type` (string, required): "rule-based" or "llm-driven"
- `wallet_id` (string, required): Associated wallet ID
- `policy` (object, optional): Agent policy configuration

**Policy Schema:**
```json
{
  "max_transaction_amount": 0.5,
  "auto_approve_below": 0.1,
  "require_simulation": true
}
```

**Returns:**
```json
{
  "agent_id": "uuid-string",
  "name": "Trading Agent",
  "agent_type": "llm-driven",
  "wallet_id": "wallet-uuid",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Example:**
```bash
POST /api/agents
{
  "name": "Smart Agent 1",
  "agent_type": "llm-driven",
  "wallet_id": "wallet-123",
  "policy": {
    "max_transaction_amount": 0.5,
    "auto_approve_below": 0.1
  }
}
```

---

### `execute_agent_action(agent_id: string, action_type: string, params: object) -> DecisionResponse`

Execute an agent decision.

**Parameters:**
- `agent_id` (string, required): Agent ID
- `action_type` (string, required): "transfer", "swap", etc.
- `params` (object, required): Action-specific parameters

**Transfer Params:**
```json
{
  "to": "recipient-pubkey",
  "amount": 0.05
}
```

**Returns (Rule-Based):**
```json
{
  "approved": true,
  "action": "transfer",
  "params": {"to": "...", "amount": 0.05},
  "decision_type": "rule-based",
  "auto_execute": true
}
```

**Returns (LLM-Driven):**
```json
{
  "approved": true,
  "reason": "Transaction amount is within safe limits",
  "risk_level": "low",
  "decision_type": "llm-driven",
  "llm_response": "..."
}
```

**Example:**
```bash
POST /api/agents/execute
{
  "agent_id": "agent-123",
  "action_type": "transfer",
  "params": {
    "to": "5mPq...2Xyz",
    "amount": 0.05
  }
}
```

---

## Transaction Operations

### `simulate_transaction(wallet_id: string, to_address: string, amount: float) -> SimulationResponse`

Simulate a transaction before execution.

**Parameters:**
- `wallet_id` (string, required): Source wallet
- `to_address` (string, required): Recipient pubkey
- `amount` (float, required): Amount in SOL

**Returns:**
```json
{
  "valid": true,
  "from": "7xKz...9Abc",
  "to": "5mPq...2Xyz",
  "amount": 0.05,
  "estimated_fee": 0.000005,
  "final_balance": 1.449995
}
```

**Example:**
```bash
POST /api/transactions/transfer
{
  "wallet_id": "wallet-123",
  "to_address": "5mPq...2Xyz",
  "amount": 0.05,
  "simulate_only": true
}
```

---

### `sign_and_send(wallet_id: string, to_address: string, amount: float) -> TransactionResponse`

Sign and send a transaction.

**Parameters:**
- `wallet_id` (string, required): Source wallet
- `to_address` (string, required): Recipient pubkey
- `amount` (float, required): Amount in SOL

**Returns:**
```json
{
  "success": true,
  "signature": "3Kx9...",
  "from": "7xKz...9Abc",
  "to": "5mPq...2Xyz",
  "amount": 0.05,
  "explorer_url": "https://explorer.solana.com/tx/...?cluster=devnet"
}
```

**Example:**
```bash
POST /api/transactions/transfer
{
  "wallet_id": "wallet-123",
  "to_address": "5mPq...2Xyz",
  "amount": 0.05,
  "simulate_only": false
}
```

---

## Policy Operations

### `set_spend_limit(wallet_id: string, daily_limit_sol: float) -> PolicyResponse`

Update wallet spending policy.

**Parameters:**
- `wallet_id` (string, required): Target wallet
- `daily_limit_sol` (float, required): Max daily spend in SOL

**Returns:**
```json
{
  "wallet_id": "wallet-123",
  "max_daily_spend": 10.0,
  "allowed_actions": ["transfer", "swap", "airdrop"],
  "require_simulation": true
}
```

**Example:**
```bash
POST /api/policies
{
  "wallet_id": "wallet-123",
  "max_daily_spend": 5.0
}
```

---

### `verify_policy(wallet_id: string, action_json: object) -> PolicyCheckResponse`

Verify if an action complies with wallet policy.

**Parameters:**
- `wallet_id` (string, required): Wallet to check
- `action_json` (object, required): Proposed action

**Returns:**
```json
{
  "allowed": true,
  "reason": "Action complies with all policies",
  "policy": {
    "max_daily_spend": 10.0,
    "allowed_actions": ["transfer"]
  }
}
```

---

## Audit Operations

### `get_audit_logs(wallet_id: string, limit: int) -> AuditLogsResponse`

Retrieve audit trail.

**Parameters:**
- `wallet_id` (string, optional): Filter by wallet
- `limit` (int, optional): Max results (default: 100)

**Returns:**
```json
[
  {
    "wallet_id": "wallet-123",
    "action_type": "transfer",
    "params": {"to": "...", "amount": 0.05},
    "result": {"success": true, "signature": "..."},
    "timestamp": "2024-01-15T10:30:00Z",
    "success": true
  }
]
```

**Example:**
```bash
GET /api/audit/logs?wallet_id=wallet-123&limit=50
```

---

## Error Responses

All endpoints return structured errors:

```json
{
  "error": "Insufficient balance",
  "code": "INSUFFICIENT_FUNDS",
  "details": {
    "required": 0.1,
    "available": 0.05
  }
}
```

---

## Agent Decision Flow

```
1. Agent receives action request
2. Load wallet policy
3. Run decision logic (rule-based or LLM)
4. If approved:
   a. Simulate transaction
   b. Verify policy compliance
   c. Sign and send transaction
   d. Log to audit trail
5. Return result
```

---

## Rate Limits

- Wallet creation: 10/minute
- Airdrop requests: 1/hour per wallet
- Transactions: 100/minute per wallet
- Agent executions: 50/minute per agent

---

## Notes for AI Agents

1. Always simulate transactions before execution
2. Check policy compliance before signing
3. Monitor audit logs for anomalies
4. Use rule-based agents for deterministic actions
5. Use LLM-driven agents for complex decision-making
6. All timestamps are in ISO 8601 UTC format
7. All amounts are in SOL (lamports = SOL * 1e9)

---

**Last Updated:** January 2024  
**API Version:** 1.0  
**Network:** Solana Devnet