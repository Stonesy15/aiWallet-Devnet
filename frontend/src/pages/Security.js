import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const SecurityFeature = ({ icon: Icon, title, description, status }) => {
  return (
    <div className="terminal-border rounded-md p-6 card-hover" data-testid={`security-feature-${title.toLowerCase().replace(' ', '-')}`}>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-[#14F195]/10 rounded-md border border-[#14F195]/30">
          <Icon size={24} className="text-[#14F195]" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-mono font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-zinc-400 mb-3">{description}</p>
          
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-xs font-mono text-green-400 uppercase">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PolicyManager = ({ wallets }) => {
  const [selectedWallet, setSelectedWallet] = useState("");
  const [policy, setPolicy] = useState(null);
  const [maxSpend, setMaxSpend] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (selectedWallet) {
      loadPolicy(selectedWallet);
    }
  }, [selectedWallet]);
  
  const loadPolicy = async (walletId) => {
    try {
      const response = await axios.get(`${API}/policies/${walletId}`);
      setPolicy(response.data);
      setMaxSpend(response.data.max_daily_spend?.toString() || "");
    } catch (error) {
      console.error("Error loading policy:", error);
    }
  };
  
  const handleUpdatePolicy = async () => {
    if (!selectedWallet || !maxSpend) {
      toast.error("Please select a wallet and enter spend limit");
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API}/policies`, {
        wallet_id: selectedWallet,
        max_daily_spend: parseFloat(maxSpend)
      });
      toast.success("Policy updated successfully");
      loadPolicy(selectedWallet);
    } catch (error) {
      console.error("Error updating policy:", error);
      toast.error("Failed to update policy");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="terminal-border rounded-md p-6" data-testid="policy-manager">
      <h3 className="text-lg font-mono font-semibold text-white mb-4">Policy Management</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="policy-wallet" className="text-sm font-mono text-zinc-300">Select Wallet</Label>
          <Select value={selectedWallet} onValueChange={setSelectedWallet}>
            <SelectTrigger className="mt-2 bg-[#09090b] border-[#27272a] text-white font-mono" data-testid="policy-wallet-select">
              <SelectValue placeholder="Choose a wallet" />
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
        
        {policy && (
          <>
            <div>
              <Label htmlFor="max-spend" className="text-sm font-mono text-zinc-300">Max Daily Spend (SOL)</Label>
              <Input
                id="max-spend"
                type="number"
                value={maxSpend}
                onChange={(e) => setMaxSpend(e.target.value)}
                step="0.1"
                className="mt-2 bg-[#09090b] border-[#27272a] text-white font-mono"
                data-testid="max-spend-input"
              />
            </div>
            
            <div className="p-3 bg-[#09090b] rounded border border-[#27272a]">
              <div className="text-xs text-zinc-400 font-mono uppercase mb-2">Current Policy</div>
              <div className="text-xs font-mono text-zinc-300 space-y-1">
                <div>Allowed Actions: {policy.allowed_actions?.join(", ")}</div>
                <div>Simulation Required: {policy.require_simulation ? "Yes" : "No"}</div>
              </div>
            </div>
            
            <Button
              onClick={handleUpdatePolicy}
              disabled={loading}
              className="w-full bg-[#14F195] text-black hover:bg-[#10c479] font-mono uppercase tracking-wide"
              data-testid="update-policy-btn"
            >
              {loading ? "Updating..." : "Update Policy"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default function Security() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadWallets();
  }, []);
  
  const loadWallets = async () => {
    try {
      const response = await axios.get(`${API}/wallets`);
      setWallets(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading wallets:", error);
      toast.error("Failed to load wallets");
      setLoading(false);
    }
  };
  
  const securityFeatures = [
    {
      icon: Lock,
      title: "Encrypted Key Storage",
      description: "Private keys are encrypted using AES-GCM with PBKDF2 key derivation (100,000 iterations)",
      status: "Active"
    },
    {
      icon: Eye,
      title: "Transaction Simulation",
      description: "All transactions are simulated before execution to prevent errors and validate balances",
      status: "Active"
    },
    {
      icon: Shield,
      title: "Policy Enforcement",
      description: "Configurable spending limits and action whitelists prevent unauthorized operations",
      status: "Active"
    },
    {
      icon: AlertTriangle,
      title: "Audit Logging",
      description: "Immutable audit trail of all wallet operations with timestamps and transaction signatures",
      status: "Active"
    }
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="text-zinc-400 font-mono animate-pulse">Loading security settings...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8" data-testid="security-page">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold font-mono text-white tracking-tight">
          Security
        </h1>
        <p className="text-base text-zinc-400 mt-2">
          Comprehensive security features and policy management
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {securityFeatures.map((feature, idx) => (
          <SecurityFeature key={idx} {...feature} />
        ))}
      </div>
      
      <PolicyManager wallets={wallets} />
      
      <div className="terminal-border rounded-md p-6" data-testid="security-recommendations">
        <h3 className="text-lg font-mono font-semibold text-white mb-4">Security Recommendations</h3>
        
        <div className="space-y-3 text-sm text-zinc-300">
          <div className="flex items-start gap-3">
            <CheckCircle size={16} className="text-green-400 mt-0.5" />
            <p className="font-mono">Keys are never exposed in API responses</p>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle size={16} className="text-green-400 mt-0.5" />
            <p className="font-mono">All transactions are signed server-side with encrypted keys</p>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle size={16} className="text-green-400 mt-0.5" />
            <p className="font-mono">Running on Solana devnet for safe testing</p>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle size={16} className="text-green-400 mt-0.5" />
            <p className="font-mono">Agent decisions are logged and auditable</p>
          </div>
          
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
            <p className="font-mono text-yellow-400">
              For production: Implement HSM/KMS, multi-sig wallets, and rate limiting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}