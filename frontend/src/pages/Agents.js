import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { motion } from "framer-motion";
import { Activity, Plus, Play, Pause, Brain, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const AgentCard = ({ agent, wallet, onExecute }) => {
  const [executing, setExecuting] = useState(false);
  const [testAmount, setTestAmount] = useState("0.05");
  
  const handleExecute = async () => {
    setExecuting(true);
    try {
      await onExecute(agent.agent_id, parseFloat(testAmount));
    } finally {
      setExecuting(false);
    }
  };
  
  return (
    <motion.div 
      className="terminal-border rounded-md p-6 card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`agent-card-${agent.agent_id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md border ${
            agent.agent_type === "llm-driven"
              ? "bg-[#9945FF]/10 border-[#9945FF]/30"
              : "bg-[#3B82F6]/10 border-[#3B82F6]/30"
          }`}>
            {agent.agent_type === "llm-driven" ? (
              <Brain size={20} className="text-[#9945FF]" />
            ) : (
              <Zap size={20} className="text-[#3B82F6]" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-mono font-semibold text-white">{agent.name}</h3>
            <span className="text-xs font-mono px-2 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/30">
              {agent.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="p-3 bg-[#09090b] rounded border border-[#27272a]">
          <div className="text-xs text-zinc-400 font-mono uppercase mb-2">Type</div>
          <div className="text-sm font-mono text-white">
            {agent.agent_type === "llm-driven" ? "LLM-Driven (GPT-5.2)" : "Rule-Based"}
          </div>
        </div>
        
        <div className="p-3 bg-[#09090b] rounded border border-[#27272a]">
          <div className="text-xs text-zinc-400 font-mono uppercase mb-2">Wallet</div>
          <div className="text-xs font-mono text-white truncate">
            {wallet?.name || "Unknown"}
          </div>
        </div>
        
        <div className="p-3 bg-[#09090b] rounded border border-[#27272a]">
          <div className="text-xs text-zinc-400 font-mono uppercase mb-2">Policy</div>
          <div className="text-xs font-mono text-zinc-300 space-y-1">
            <div>Max TX: {agent.policy?.max_transaction_amount} SOL</div>
            <div>Auto-approve: {agent.policy?.auto_approve_below} SOL</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            placeholder="Amount (SOL)"
            step="0.01"
            className="bg-[#09090b] border-[#27272a] text-white font-mono text-sm"
            data-testid={`test-amount-input-${agent.agent_id}`}
          />
          
          <Button
            onClick={handleExecute}
            disabled={executing}
            className="w-full bg-[#14F195] text-black hover:bg-[#10c479] font-mono text-xs uppercase tracking-wide"
            data-testid={`execute-agent-btn-${agent.agent_id}`}
          >
            <Play size={14} className="mr-2" />
            {executing ? "Testing Decision..." : "Test Agent Decision"}
          </Button>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#27272a] text-xs text-zinc-500 font-mono">
        Created: {new Date(agent.created_at).toLocaleDateString()}
      </div>
    </motion.div>
  );
};

const CreateAgentDialog = ({ wallets, onCreateAgent }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [agentType, setAgentType] = useState("rule-based");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [creating, setCreating] = useState(false);
  
  const handleCreate = async () => {
    if (!name.trim() || !selectedWallet) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setCreating(true);
    try {
      await onCreateAgent(name, agentType, selectedWallet);
      setOpen(false);
      setName("");
      setAgentType("rule-based");
      setSelectedWallet("");
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-[#14F195] text-black hover:bg-[#10c479] font-mono text-sm uppercase tracking-wide shadow-[0_0_10px_rgba(20,241,149,0.2)]"
          data-testid="create-agent-dialog-btn"
        >
          <Plus size={18} className="mr-2" />
          Create Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-[#27272a] text-white" data-testid="create-agent-modal">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">Create New Agent</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="agent-name" className="text-sm font-mono text-zinc-300">Agent Name</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Trading Agent 1"
              className="mt-2 bg-[#09090b] border-[#27272a] text-white font-mono"
              data-testid="agent-name-input"
            />
          </div>
          
          <div>
            <Label htmlFor="agent-type" className="text-sm font-mono text-zinc-300">Agent Type</Label>
            <Select value={agentType} onValueChange={setAgentType}>
              <SelectTrigger className="mt-2 bg-[#09090b] border-[#27272a] text-white font-mono" data-testid="agent-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                <SelectItem value="rule-based" className="font-mono">Rule-Based (Policy-Driven)</SelectItem>
                <SelectItem value="llm-driven" className="font-mono">LLM-Driven (GPT-5.2)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500 mt-2 font-mono">
              {agentType === "llm-driven" 
                ? "Uses OpenAI GPT-5.2 for intelligent decision-making"
                : "Uses predefined rules and policies for decisions"}
            </p>
          </div>
          
          <div>
            <Label htmlFor="wallet" className="text-sm font-mono text-zinc-300">Associated Wallet</Label>
            <Select value={selectedWallet} onValueChange={setSelectedWallet}>
              <SelectTrigger className="mt-2 bg-[#09090b] border-[#27272a] text-white font-mono" data-testid="agent-wallet-select">
                <SelectValue placeholder="Select a wallet" />
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.wallet_id} value={wallet.wallet_id} className="font-mono">
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full bg-[#14F195] text-black hover:bg-[#10c479] font-mono uppercase tracking-wide"
            data-testid="create-agent-submit-btn"
          >
            {creating ? "Creating..." : "Create Agent"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const [agentsRes, walletsRes] = await Promise.all([
        axios.get(`${API}/agents`),
        axios.get(`${API}/wallets`)
      ]);
      setAgents(agentsRes.data);
      setWallets(walletsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load agents");
      setLoading(false);
    }
  };
  
  const handleCreateAgent = async (name, agentType, walletId) => {
    try {
      await axios.post(`${API}/agents`, {
        name,
        agent_type: agentType,
        wallet_id: walletId
      });
      toast.success("Agent created successfully");
      loadData();
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent");
      throw error;
    }
  };
  
  const handleExecuteAgent = async (agentId, amount) => {
    try {
      const agent = agents.find(a => a.agent_id === agentId);
      const wallet = wallets.find(w => w.wallet_id === agent?.wallet_id);
      
      if (!wallet) {
        toast.error("Wallet not found");
        return;
      }
      
      const targetWallet = wallets.find(w => w.wallet_id !== agent.wallet_id);
      if (!targetWallet) {
        toast.error("Need at least 2 wallets for testing");
        return;
      }
      
      toast.info("Agent is analyzing the transaction...");
      
      const response = await axios.post(`${API}/agents/execute`, {
        agent_id: agentId,
        action_type: "transfer",
        params: {
          to: targetWallet.pubkey,
          amount: amount
        }
      });
      
      if (response.data.approved) {
        toast.success(`Agent approved! Decision type: ${response.data.decision_type}`);
      } else {
        toast.warning(`Agent denied: ${response.data.reason}`);
      }
    } catch (error) {
      console.error("Error executing agent:", error);
      toast.error("Failed to execute agent action");
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="text-zinc-400 font-mono animate-pulse">Loading agents...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8" data-testid="agents-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-mono text-white tracking-tight">
            AI Agents
          </h1>
          <p className="text-base text-zinc-400 mt-2">
            Autonomous agents with rule-based and LLM-driven decision-making
          </p>
        </div>
        
        <CreateAgentDialog wallets={wallets} onCreateAgent={handleCreateAgent} />
      </div>
      
      {agents.length === 0 ? (
        <div className="terminal-border rounded-md p-12 text-center" data-testid="no-agents-message">
          <Activity size={48} className="mx-auto text-zinc-600 mb-4" />
          <h3 className="text-lg font-mono text-zinc-400 mb-2">No agents yet</h3>
          <p className="text-sm text-zinc-500 font-mono mb-6">
            Create your first AI agent to automate wallet operations
          </p>
          {wallets.length === 0 ? (
            <p className="text-xs text-zinc-600 font-mono">Create a wallet first</p>
          ) : (
            <CreateAgentDialog wallets={wallets} onCreateAgent={handleCreateAgent} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const wallet = wallets.find(w => w.wallet_id === agent.wallet_id);
            return (
              <AgentCard 
                key={agent.agent_id}
                agent={agent}
                wallet={wallet}
                onExecute={handleExecuteAgent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}