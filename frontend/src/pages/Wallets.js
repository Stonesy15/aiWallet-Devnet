import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { motion } from "framer-motion";
import { Wallet, Plus, Copy, ExternalLink, Coins, RefreshCw } from "lucide-react";
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

const WalletCard = ({ wallet, onFund, onRefresh }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  
  return (
    <motion.div 
      className="terminal-border rounded-md p-6 card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`wallet-card-${wallet.wallet_id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#14F195]/10 rounded-md border border-[#14F195]/30">
            <Wallet size={20} className="text-[#14F195]" />
          </div>
          <div>
            <h3 className="text-lg font-mono font-semibold text-white">{wallet.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono px-2 py-0.5 bg-[#9945FF]/10 text-[#9945FF] rounded border border-[#9945FF]/30">
                {wallet.key_management_type.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-[#09090b] rounded border border-[#27272a]">
          <span className="text-xs text-zinc-400 font-mono uppercase">Balance</span>
          <span className="text-lg font-mono font-bold text-[#14F195]">
            {wallet.balances?.SOL?.toFixed(4) || "0.0000"} SOL
          </span>
        </div>
        
        <div className="p-3 bg-[#09090b] rounded border border-[#27272a]">
          <div className="text-xs text-zinc-400 font-mono uppercase mb-2">Public Key</div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-white break-all flex-1">
              {wallet.pubkey}
            </code>
            <button 
              onClick={() => copyToClipboard(wallet.pubkey)}
              className="text-zinc-400 hover:text-[#14F195] transition-colors"
              data-testid={`copy-pubkey-${wallet.wallet_id}`}
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => onFund(wallet.wallet_id)}
            className="flex-1 bg-[#14F195] text-black hover:bg-[#10c479] font-mono text-xs uppercase tracking-wide"
            data-testid={`fund-wallet-btn-${wallet.wallet_id}`}
          >
            <Coins size={14} className="mr-2" />
            Request Airdrop
          </Button>
          <Button
            onClick={() => onRefresh(wallet.wallet_id)}
            variant="outline"
            className="border-[#27272a] bg-transparent hover:bg-[#27272a] text-white"
            data-testid={`refresh-wallet-btn-${wallet.wallet_id}`}
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#27272a] text-xs text-zinc-500 font-mono">
        Created: {new Date(wallet.created_at).toLocaleDateString()}
      </div>
    </motion.div>
  );
};

const CreateWalletDialog = ({ onCreateWallet }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [keyType, setKeyType] = useState("encrypted");
  const [creating, setCreating] = useState(false);
  
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a wallet name");
      return;
    }
    
    setCreating(true);
    try {
      await onCreateWallet(name, keyType);
      setOpen(false);
      setName("");
      setKeyType("encrypted");
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
          data-testid="create-wallet-dialog-btn"
        >
          <Plus size={18} className="mr-2" />
          Create Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-[#27272a] text-white" data-testid="create-wallet-modal">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">Create New Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="wallet-name" className="text-sm font-mono text-zinc-300">Wallet Name</Label>
            <Input
              id="wallet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Agent Wallet"
              className="mt-2 bg-[#09090b] border-[#27272a] text-white font-mono"
              data-testid="wallet-name-input"
            />
          </div>
          
          <div>
            <Label htmlFor="key-type" className="text-sm font-mono text-zinc-300">Key Management Type</Label>
            <Select value={keyType} onValueChange={setKeyType}>
              <SelectTrigger className="mt-2 bg-[#09090b] border-[#27272a] text-white font-mono" data-testid="key-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                <SelectItem value="encrypted" className="font-mono">Encrypted (AES-GCM)</SelectItem>
                <SelectItem value="ephemeral" className="font-mono">Ephemeral Signing</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500 mt-2 font-mono">
              {keyType === "encrypted" 
                ? "Keys are encrypted with PBKDF2 and stored securely"
                : "Keys are stored in base64 for ephemeral signing"}
            </p>
          </div>
          
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full bg-[#14F195] text-black hover:bg-[#10c479] font-mono uppercase tracking-wide"
            data-testid="create-wallet-submit-btn"
          >
            {creating ? "Creating..." : "Create Wallet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Wallets() {
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
  
  const handleCreateWallet = async (name, keyType) => {
    try {
      await axios.post(`${API}/wallets`, {
        name,
        key_management_type: keyType
      });
      toast.success("Wallet created successfully");
      loadWallets();
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast.error("Failed to create wallet");
      throw error;
    }
  };
  
  const handleFundWallet = async (walletId) => {
    try {
      toast.info("Requesting airdrop from Solana devnet...");
      const response = await axios.post(`${API}/wallets/${walletId}/fund`);
      
      if (response.data.success) {
        toast.success("Airdrop successful! 1 SOL added");
        setTimeout(() => loadWallets(), 2000);
      } else {
        toast.error(response.data.error || "Airdrop failed");
      }
    } catch (error) {
      console.error("Error funding wallet:", error);
      toast.error("Failed to request airdrop");
    }
  };
  
  const handleRefreshWallet = async (walletId) => {
    toast.info("Refreshing wallet balance...");
    await loadWallets();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="text-zinc-400 font-mono animate-pulse">Loading wallets...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8" data-testid="wallets-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-mono text-white tracking-tight">
            Wallets
          </h1>
          <p className="text-base text-zinc-400 mt-2">
            Manage your Solana wallets with secure key management
          </p>
        </div>
        
        <CreateWalletDialog onCreateWallet={handleCreateWallet} />
      </div>
      
      {wallets.length === 0 ? (
        <div className="terminal-border rounded-md p-12 text-center" data-testid="no-wallets-message">
          <Wallet size={48} className="mx-auto text-zinc-600 mb-4" />
          <h3 className="text-lg font-mono text-zinc-400 mb-2">No wallets yet</h3>
          <p className="text-sm text-zinc-500 font-mono mb-6">
            Create your first wallet to get started
          </p>
          <CreateWalletDialog onCreateWallet={handleCreateWallet} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <WalletCard 
              key={wallet.wallet_id}
              wallet={wallet}
              onFund={handleFundWallet}
              onRefresh={handleRefreshWallet}
            />
          ))}
        </div>
      )}
    </div>
  );
}