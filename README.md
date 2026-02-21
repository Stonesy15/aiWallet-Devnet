# Agentic Wallet - Professional AI Agent Wallet System for Solana

[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?style=for-the-badge&logo=solana)](https://solana.com)
[![License](https://img.shields.io/badge/License-MIT-9945FF?style=for-the-badge)](LICENSE)

A production-minded **Agentic Wallet** prototype for AI agents on Solana devnet. Demonstrates autonomous transaction capabilities, secure key management, and clear separation between agent logic and wallet operations.

## 🎯 Features

### Wallet Management
- **Dual Key Management**: Encrypted (AES-GCM) and Ephemeral signing options
- **Programmatic Creation**: Generate wallets without human intervention
- **SOL & SPL Token Support**: Hold and transfer Solana assets
- **Devnet Integration**: Safe testing on Solana devnet

### AI Agents
- **Rule-Based Agents**: Policy-driven decision making
- **LLM-Driven Agents**: GPT-5.2 powered intelligent decisions
- **Configurable Policies**: Spend limits, action whitelists
- **Multi-Agent Support**: Independent agents with separate wallets

### Security
- **Encrypted Key Storage**: PBKDF2 + AES-GCM encryption
- **Transaction Simulation**: Validate before execution
- **Policy Enforcement**: Configurable spending limits
- **Audit Logging**: Immutable transaction trail
- **Replay Protection**: Nonce tracking and validation

### User Interface
- **Web Dashboard**: Real-time monitoring and control
- **CLI Tools**: Command-line wallet and agent management
- **Transaction Explorer**: View on-chain activity

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and Yarn
- Python 3.11+
- MongoDB

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd /app

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
yarn install
```

### Environment Setup

Backend environment variables are pre-configured in `/app/backend/.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
SOLANA_NETWORK=devnet
MAX_DAILY_SOL_SPEND=10
EMERGENT_LLM_KEY=sk-emergent-XXXXX
```

Frontend environment variables in `/app/frontend/.env`:
```env
REACT_APP_BACKEND_URL=<your-backend-url>
```

### Running the Application

The application is managed by supervisor:

```bash
# Check status
sudo supervisorctl status

# Restart services if needed
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Running the Demo

```bash
# Execute the comprehensive demo script
chmod +x /app/scripts/run_demo.sh
/app/scripts/run_demo.sh
```

The demo will:
1. Create 2 wallets (encrypted and ephemeral)
2. Fund them via devnet airdrop
3. Create AI agents (rule-based and LLM-driven)
4. Simulate and execute a transfer
5. Display transaction links on Solana Explorer

## 📚 CLI Usage

```bash
# Create a wallet
python3 /app/scripts/cli.py create-wallet "My Wallet" --key-type encrypted

# List all wallets
python3 /app/scripts/cli.py list-wallets

# Fund a wallet
python3 /app/scripts/cli.py fund-wallet <PUBKEY> --amount 1.0

# Create an agent
python3 /app/scripts/cli.py create-agent "Agent1" rule-based <WALLET_ID>

# View audit logs
python3 /app/scripts/cli.py audit-logs --limit 20
```

## 💻 API Endpoints

### Wallets
- `POST /api/wallets` - Create wallet
- `GET /api/wallets` - List all wallets
- `GET /api/wallets/{wallet_id}` - Get wallet details
- `POST /api/wallets/{wallet_id}/fund` - Request airdrop

### Agents
- `POST /api/agents` - Create AI agent
- `GET /api/agents` - List all agents
- `POST /api/agents/execute` - Execute agent action

### Transactions
- `POST /api/transactions/transfer` - Transfer SOL
- `GET /api/audit/logs` - Get audit trail

### Policies
- `POST /api/policies` - Update policy
- `GET /api/policies/{wallet_id}` - Get wallet policy

## 🛠️ Architecture

```
/app
├── backend/
│   ├── server.py              # FastAPI application
│   ├── services/
│   │   ├── wallet_service.py   # Key management & signing
│   │   ├── agent_service.py    # AI agent logic
│   │   ├── solana_service.py   # Blockchain interactions
│   │   └── audit_service.py    # Logging & compliance
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Wallets.js
│   │   │   ├── Agents.js
│   │   │   ├── Transactions.js
│   │   │   └── Security.js
│   │   └── components/ui/
│   └── package.json
├── scripts/
│   ├── demo.py              # Comprehensive demo
│   ├── run_demo.sh          # Demo runner
│   └── cli.py               # CLI tool
├── README.md
├── SKILLS.md
└── SECURITY.md
```

## 📊 Demo Results

After running the demo, you'll see:
- Wallet creation confirmations
- Devnet airdrop transaction IDs
- Agent decision logs
- Transfer transaction signature
- Solana Explorer links

Example output:
```
[1] Creating wallets...
  ✓ Created encrypted wallet: 7xKz...9Abc
  ✓ Created ephemeral wallet: 5mPq...2Xyz

[2] Funding wallets...
  ✓ Funded wallet 1: https://explorer.solana.com/tx/...?cluster=devnet

[3] Creating AI agents...
  ✓ Created rule-based agent: agent-123
  ✓ Created LLM-driven agent: agent-456

[7] Transfer successful!
  Signature: 3Kx9...
  Explorer: https://explorer.solana.com/tx/3Kx9...?cluster=devnet
```

## 🔒 Security Considerations

See [SECURITY.md](SECURITY.md) for detailed security architecture and threat model.

## 🤖 Agent Capabilities

See [SKILLS.md](SKILLS.md) for machine-readable agent commands and capabilities.

## 📝 License

MIT License - See LICENSE file for details.

## 🚀 Production Roadmap

For production deployment:
- [ ] Integrate HSM/KMS for key management
- [ ] Implement multi-signature wallets
- [ ] Add rate limiting and DDoS protection
- [ ] Enable mainnet support
- [ ] Add SPL token swap functionality
- [ ] Implement advanced agent strategies
- [ ] Add webhook notifications
- [ ] Enhance monitoring and alerting

## 📞 Resources

- [Solana Documentation](https://docs.solana.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

---

**Built for Solana Hackathon** | **Devnet Prototype** | **Not for Production Use**