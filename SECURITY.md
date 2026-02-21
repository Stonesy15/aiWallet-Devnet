# SECURITY.md - Security Architecture & Threat Model

## Executive Summary

This document outlines the security architecture of the Agentic Wallet system, including threat modeling, mitigation strategies, and production recommendations.

**Current Status:** Devnet Prototype  
**Security Level:** Development/Testing  
**Production Ready:** No (see Production Roadmap)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Threat Model](#threat-model)
3. [Key Management](#key-management)
4. [Transaction Security](#transaction-security)
5. [Agent Security](#agent-security)
6. [Network Security](#network-security)
7. [Audit & Compliance](#audit--compliance)
8. [Production Recommendations](#production-recommendations)

---

## Architecture Overview

### Component Separation

```
┌─────────────────────────┐
│   Agent Decision Layer   │
│  (Rule-based / LLM)     │
└───────────┬─────────────┘
           │
           v
┌─────────────────────────┐
│  Policy Enforcement     │
│  (Limits & Whitelists)  │
└───────────┬─────────────┘
           │
           v
┌─────────────────────────┐
│  Transaction Simulation │
│  (Validate before sign) │
└───────────┬─────────────┘
           │
           v
┌─────────────────────────┐
│   Signing Service       │
│   (Encrypted Keys)      │
└───────────┬─────────────┘
           │
           v
┌─────────────────────────┐
│   Solana Devnet RPC     │
└─────────────────────────┘
```

### Security Principles

1. **Least Privilege**: Agents only have access to their assigned wallet
2. **Defense in Depth**: Multiple validation layers before signing
3. **Fail Secure**: All errors result in transaction rejection
4. **Audit Everything**: Immutable log of all operations
5. **Separation of Concerns**: Clear boundaries between components

---

## Threat Model

### Threat Actors

1. **External Attacker**: Attempts to steal funds or disrupt service
2. **Malicious Agent**: Compromised or rogue AI agent
3. **Insider Threat**: Privileged access abuse
4. **Network Attacker**: MITM or RPC manipulation

### Attack Scenarios & Mitigations

#### 1. Private Key Theft

**Threat**: Attacker gains access to private keys

**Mitigations**:
- ✅ Keys encrypted at rest (AES-256-GCM)
- ✅ PBKDF2 key derivation (100,000 iterations)
- ✅ Keys never exposed in API responses
- ✅ Separate encryption key per environment
- ⚠️ Production: HSM/KMS required

**Risk Level**: HIGH (devnet), CRITICAL (mainnet)

---

#### 2. Unauthorized Transaction

**Threat**: Agent or attacker executes unauthorized transaction

**Mitigations**:
- ✅ Policy enforcement layer
- ✅ Spending limits per wallet
- ✅ Action whitelist (transfer, swap, etc.)
- ✅ Transaction simulation before signing
- ✅ Rate limiting per wallet/agent
- ✅ Audit logging

**Risk Level**: MEDIUM

---

#### 3. Replay Attack

**Threat**: Attacker replays valid signed transaction

**Mitigations**:
- ✅ Solana's recent blockhash mechanism
- ✅ Transaction signatures are unique
- ✅ Nonce tracking in audit logs
- ✅ Short blockhash validity window (~90 seconds)

**Risk Level**: LOW

---

#### 4. LLM Prompt Injection

**Threat**: Attacker manipulates LLM to approve malicious transaction

**Mitigations**:
- ✅ System prompt hardening
- ✅ Input sanitization
- ✅ Policy enforcement after LLM decision
- ✅ Structured output validation (JSON schema)
- ✅ Hard limits override LLM decisions
- ⚠️ Production: Add adversarial testing

**Risk Level**: MEDIUM-HIGH

---

#### 5. Insufficient Balance

**Threat**: Transaction fails due to insufficient funds

**Mitigations**:
- ✅ Pre-transaction balance check
- ✅ Transaction simulation
- ✅ Fee estimation
- ✅ Graceful failure handling

**Risk Level**: LOW

---

#### 6. Database Compromise

**Threat**: Attacker gains access to MongoDB

**Mitigations**:
- ✅ Keys are encrypted (not plaintext)
- ✅ Network isolation
- ⚠️ Production: Authentication required
- ⚠️ Production: TLS for connections
- ⚠️ Production: Role-based access control

**Risk Level**: HIGH (current), MEDIUM (with production mitigations)

---

#### 7. RPC Manipulation

**Threat**: Attacker compromises Solana RPC endpoint

**Mitigations**:
- ✅ Use official Solana RPC endpoints
- ✅ Transaction signature verification
- ⚠️ Production: Multiple RPC endpoints
- ⚠️ Production: Response validation

**Risk Level**: MEDIUM

---

## Key Management

### Current Implementation (Devnet)

#### Encrypted Key Storage

```python
Key Derivation:
  Passphrase -> PBKDF2 (100k iterations, SHA256) -> AES-256 Key
  
Encryption:
  Private Key -> AES-GCM (256-bit) -> Base64 -> MongoDB
  
Decryption:
  MongoDB -> Base64 -> AES-GCM Decrypt -> Private Key (in-memory)
```

**Properties**:
- Encryption: AES-256-GCM (authenticated encryption)
- Key Derivation: PBKDF2-HMAC-SHA256, 100,000 iterations
- Salt: Fixed per environment (should be per-key in production)
- Passphrase: Environment variable

**Security Assessment**:
- ✅ Strong encryption algorithm
- ✅ High iteration count prevents brute force
- ⚠️ Passphrase in env var (acceptable for dev)
- ⚠️ Fixed salt (should be unique per key)
- ❌ No key rotation mechanism
- ❌ No HSM/KMS integration

#### Ephemeral Signing

```python
Storage:
  Private Key -> Base64 -> MongoDB
  
Usage:
  Load -> Sign -> Discard from memory
```

**Properties**:
- Keys stored in base64 (not encrypted)
- Loaded only when needed
- Immediate memory cleanup after signing

**Security Assessment**:
- ⚠️ No encryption at rest
- ✅ Minimal memory exposure
- ✅ Suitable for short-lived operations
- ❌ Not recommended for production

### Production Key Management

**Required Changes**:

1. **HSM/KMS Integration**
   - AWS KMS, Azure Key Vault, or Google Cloud KMS
   - Hardware security modules for critical wallets
   - Automatic key rotation

2. **Multi-Signature Wallets**
   - Require multiple approvals for high-value transactions
   - Distribute signing authority
   - Implement threshold signatures

3. **Key Hierarchy**
   - Master keys in HSM
   - Derived keys for operations
   - Separate keys per environment

4. **Key Rotation**
   - Automatic rotation schedule (90 days)
   - Zero-downtime rotation
   - Audit trail of rotations

---

## Transaction Security

### Pre-Signing Validation

Every transaction passes through multiple checks:

```
1. Policy Check
   ├─ Max transaction amount
   ├─ Daily spending limit
   ├─ Action whitelist
   └─ Allowed recipients

2. Balance Validation
   ├─ Sufficient SOL
   ├─ Fee estimation
   └─ Reserve minimum balance

3. Simulation
   ├─ RPC simulateTransaction
   ├─ Check for errors
   └─ Verify expected outcome

4. Agent Approval
   ├─ Rule-based logic
   └─ LLM decision

5. Signing
   ├─ Decrypt private key
   ├─ Sign transaction
   ├─ Verify signature
   └─ Clear key from memory

6. Broadcast
   ├─ Send to Solana RPC
   ├─ Wait for confirmation
   └─ Verify on-chain

7. Audit Log
   ├─ Record all details
   ├─ Store signature
   └─ Timestamp (UTC)
```

### Transaction Simulation

All transactions are simulated before execution:

```python
# Check if transaction would succeed
simulation = await solana_service.simulate_transfer(
    from_pubkey,
    to_pubkey,
    amount
)

if not simulation['valid']:
    return {"error": simulation['reason']}
```

**Benefits**:
- Prevents failed transactions
- Validates balance and fees
- Detects invalid recipients
- No cost until confirmed valid

---

## Agent Security

### Rule-Based Agents

**Decision Logic**:
```python
if amount > policy['max_transaction_amount']:
    return DENY

if recipient not in whitelist:
    return DENY

if daily_spent + amount > policy['daily_limit']:
    return DENY

return APPROVE
```

**Security Properties**:
- ✅ Deterministic behavior
- ✅ No external dependencies
- ✅ Fast execution
- ✅ Easily auditable

**Limitations**:
- No contextual understanding
- Cannot adapt to new scenarios
- Rigid rule enforcement

### LLM-Driven Agents

**Decision Flow**:
```python
1. Sanitize inputs
2. Construct prompt with policy context
3. Call LLM API (GPT-5.2)
4. Parse structured response
5. Validate against policy
6. Return decision
```

**Security Measures**:
- ✅ Input sanitization
- ✅ Output validation (JSON schema)
- ✅ Hard policy override
- ✅ Timeout limits
- ✅ Error handling

**Risks**:
- Prompt injection attacks
- Unpredictable decisions
- API dependency
- Latency issues
- Token budget concerns

**Mitigations**:
- Policy enforcement always runs after LLM
- Structured output format (JSON only)
- System prompt hardening
- Fallback to rule-based on error
- Regular adversarial testing

---

## Network Security

### Current Setup (Devnet)

- ✅ HTTPS for RPC connections
- ✅ CORS configured
- ⚠️ No authentication on API
- ⚠️ No rate limiting
- ❌ No DDoS protection

### Production Requirements

1. **Authentication & Authorization**
   - API key authentication
   - JWT tokens for sessions
   - Role-based access control
   - Per-agent permissions

2. **Rate Limiting**
   - Per-IP limits
   - Per-API-key limits
   - Per-wallet limits
   - Adaptive rate limiting

3. **DDoS Protection**
   - CDN integration
   - Request filtering
   - Connection limits
   - Bandwidth throttling

4. **Monitoring & Alerting**
   - Anomaly detection
   - Failed attempt tracking
   - Real-time alerts
   - Security event logging

---

## Audit & Compliance

### Audit Trail

Every operation is logged:

```json
{
  "wallet_id": "uuid",
  "action_type": "transfer",
  "params": {"to": "...", "amount": 0.05},
  "result": {
    "success": true,
    "signature": "3Kx9...",
    "explorer_url": "https://..."
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "agent_id": "agent-123",
  "decision_type": "llm-driven"
}
```

**Properties**:
- ✅ Immutable (append-only)
- ✅ Timestamped (UTC)
- ✅ Includes all context
- ✅ Links to on-chain proof
- ⚠️ No integrity verification (checksums)
- ⚠️ No off-site backup

### Compliance Considerations

**Current State**:
- Suitable for research/development
- Not suitable for regulated environments
- No KYC/AML integration
- No data retention policies

**Production Requirements**:
- Data encryption in transit and at rest
- Audit log retention (7+ years)
- Compliance reporting
- Data sovereignty controls
- Right to be forgotten (GDPR)

---

## Production Recommendations

### Critical (Must Have)

1. **HSM/KMS Integration**
   - Priority: CRITICAL
   - Timeline: Before mainnet
   - Effort: 2-3 weeks

2. **Multi-Signature Wallets**
   - Priority: CRITICAL
   - Timeline: Before mainnet
   - Effort: 1-2 weeks

3. **API Authentication**
   - Priority: CRITICAL
   - Timeline: Before public beta
   - Effort: 1 week

4. **Rate Limiting**
   - Priority: HIGH
   - Timeline: Before public beta
   - Effort: 3-5 days

### Important (Should Have)

5. **Monitoring & Alerting**
   - Priority: HIGH
   - Timeline: First month
   - Effort: 1 week

6. **Key Rotation**
   - Priority: HIGH
   - Timeline: First month
   - Effort: 1 week

7. **DDoS Protection**
   - Priority: MEDIUM-HIGH
   - Timeline: Before scale
   - Effort: 3-5 days (CDN integration)

### Nice to Have

8. **Advanced Agent Strategies**
   - Priority: MEDIUM
   - Timeline: Q2
   - Effort: 2-4 weeks

9. **Compliance Reporting**
   - Priority: MEDIUM (varies by jurisdiction)
   - Timeline: As needed
   - Effort: 1-2 weeks

---

## Security Testing

### Current Testing

- ✅ Basic functionality tests
- ✅ Transaction simulation
- ⚠️ Limited error injection
- ❌ No penetration testing
- ❌ No fuzzing
- ❌ No load testing

### Recommended Testing

1. **Unit Tests**
   - Policy enforcement
   - Key encryption/decryption
   - Transaction validation
   - Agent decision logic

2. **Integration Tests**
   - End-to-end transaction flows
   - Multi-agent scenarios
   - Error handling
   - Rollback procedures

3. **Security Tests**
   - Penetration testing
   - Prompt injection tests
   - SQL injection (if applicable)
   - API abuse scenarios
   - Rate limit bypass attempts

4. **Load Tests**
   - Concurrent agent operations
   - High transaction volume
   - Database performance
   - RPC failover

---

## Incident Response

### Detection

1. Monitor audit logs for anomalies
2. Alert on failed transactions (>5% failure rate)
3. Track unusual spending patterns
4. Watch for repeated policy violations

### Response Procedure

1. **Immediate**
   - Pause affected agents
   - Lock affected wallets
   - Notify security team

2. **Investigation**
   - Review audit logs
   - Check on-chain activity
   - Identify attack vector
   - Assess damage

3. **Remediation**
   - Rotate compromised keys
   - Update policies
   - Patch vulnerabilities
   - Resume operations

4. **Post-Mortem**
   - Document incident
   - Update procedures
   - Share learnings
   - Implement preventions

---

## Conclusion

The current implementation provides a **secure foundation for devnet testing** with multiple layers of protection. However, **production deployment requires significant security enhancements**, particularly in key management, authentication, and monitoring.

**Key Takeaways**:

1. ✅ Current system is safe for devnet experimentation
2. ⚠️ Do NOT use on mainnet without HSM/KMS
3. ⚠️ Do NOT expose to public internet without authentication
4. ✅ Architecture provides good separation of concerns
5. ✅ Multiple validation layers prevent common attacks

**Next Steps**:

1. Implement HSM/KMS integration
2. Add API authentication
3. Deploy rate limiting
4. Set up monitoring & alerting
5. Conduct security audit
6. Perform penetration testing
7. Document incident response procedures

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Classification:** Public  
**Review Cycle:** Quarterly