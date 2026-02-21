import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { motion } from "framer-motion";
import { ArrowDownUp, Coins, TrendingDown, Zap } from "lucide-react";
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

export default function Swap() {
  const [tokens, setTokens] = useState({});
  const [inputToken, setInputToken] = useState("");
  const [outputToken, setOutputToken] = useState("");
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  
  useEffect(() => {
    loadTokens();
    loadWallets();
  }, []);
  
  const loadTokens = async () => {
    try {
      const response = await axios.get(`${API}/swap/tokens`);
      setTokens(response.data);
      if (response.data.SOL && response.data.USDC) {
        setInputToken(response.data.SOL);
        setOutputToken(response.data.USDC);
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  };
  
  const loadWallets = async () => {
    try {
      const response = await axios.get(`${API}/wallets`);
      setWallets(response.data);
      if (response.data.length > 0) {
        setSelectedWallet(response.data[0].wallet_id);
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
    }
  };
  
  const getQuote = async () => {
    if (!inputAmount || !inputToken || !outputToken) {
      toast.error("Please fill all fields");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/swap/quote`, {
        input_mint: inputToken,
        output_mint: outputToken,
        amount: parseFloat(inputAmount),
        token_decimals: 9
      });
      
      if (response.data.valid) {
        setQuote(response.data);
        setOutputAmount(response.data.amount_out.toFixed(6));
        toast.success("Quote fetched successfully");
      } else {
        toast.error("Failed to get quote");
      }
    } catch (error) {
      console.error("Quote error:", error);
      toast.error("Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  };
  
  const executeSwap = async () => {
    if (!quote || !selectedWallet) {
      toast.error("Please get a quote first and select a wallet");
      return;
    }
    
    setLoading(true);
    try {
      toast.info("Executing swap...");
      
      const response = await axios.post(`${API}/swap/execute`, {
        wallet_id: selectedWallet,
        input_mint: inputToken,
        output_mint: outputToken,
        amount: parseFloat(inputAmount),
        slippage_bps: 50
      });
      
      if (response.data.success) {
        toast.success("Swap executed successfully!");
        setQuote(null);
        setInputAmount("");
        setOutputAmount("");
      } else {
        toast.error(response.data.error || "Swap failed");
      }
    } catch (error) {
      console.error("Swap error:", error);
      toast.error("Failed to execute swap");
    } finally {
      setLoading(false);
    }
  };
  
  const swapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setQuote(null);
    setOutputAmount("");
  };
  
  const tokenNames = {
    [tokens.SOL]: "SOL",
    [tokens.USDC]: "USDC",
    [tokens.USDT]: "USDT",
    [tokens.RAY]: "RAY",
    [tokens.SRM]: "SRM"
  };
  
  return (
    <div className="space-y-8" data-testid="swap-page">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold font-mono text-white tracking-tight">
          Token Swap
        </h1>
        <p className="text-base text-zinc-400 mt-2">
          Swap tokens using Jupiter aggregator on Solana {process.env.REACT_APP_SOLANA_NETWORK || 'devnet'}
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <div className="terminal-border rounded-md p-8 space-y-6">
          <div>
            <Label className="text-sm font-mono text-zinc-300">Select Wallet</Label>
            <Select value={selectedWallet} onValueChange={setSelectedWallet}>
              <SelectTrigger className="mt-2 bg-[#09090b] border-[#27272a] text-white font-mono" data-testid="swap-wallet-select">
                <SelectValue placeholder="Choose wallet" />
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
          
          <div>
            <Label className="text-sm font-mono text-zinc-300">From</Label>
            <div className="mt-2 space-y-2">
              <Select value={inputToken} onValueChange={setInputToken}>
                <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white font-mono" data-testid="input-token-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                  {Object.entries(tokens).map(([name, mint]) => (
                    <SelectItem key={mint} value={mint} className="font-mono">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                className="bg-[#09090b] border-[#27272a] text-white font-mono text-2xl"
                data-testid="input-amount"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={swapTokens}
              className="p-3 bg-[#27272a] hover:bg-[#3f3f46] rounded-full transition-colors"
              data-testid="swap-tokens-btn"
            >
              <ArrowDownUp size={20} className="text-white" />
            </button>
          </div>
          
          <div>
            <Label className="text-sm font-mono text-zinc-300">To</Label>
            <div className="mt-2 space-y-2">
              <Select value={outputToken} onValueChange={setOutputToken}>
                <SelectTrigger className="bg-[#09090b] border-[#27272a] text-white font-mono" data-testid="output-token-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-[#27272a] text-white">
                  {Object.entries(tokens).map(([name, mint]) => (
                    <SelectItem key={mint} value={mint} className="font-mono">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="text"
                value={outputAmount}
                readOnly
                placeholder="0.00"
                className="bg-[#09090b] border-[#27272a] text-white font-mono text-2xl"
                data-testid="output-amount"
              />
            </div>
          </div>
          
          {quote && (
            <div className="p-4 bg-[#09090b] rounded border border-[#27272a] space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 font-mono">Price Impact</span>
                <span className={`font-mono ${
                  Math.abs(quote.price_impact) > 1 ? "text-red-400" : "text-green-400"
                }`}>
                  {quote.price_impact.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 font-mono">Rate</span>
                <span className="text-white font-mono">
                  1 {tokenNames[inputToken]} ≈ {(quote.amount_out / parseFloat(inputAmount)).toFixed(6)} {tokenNames[outputToken]}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={getQuote}
              disabled={loading || !inputAmount}
              className="flex-1 bg-[#9945FF] text-white hover:bg-[#7d38d4] font-mono uppercase tracking-wide"
              data-testid="get-quote-btn"
            >
              <Coins size={16} className="mr-2" />
              {loading ? "Loading..." : "Get Quote"}
            </Button>
            
            {quote && (
              <Button
                onClick={executeSwap}
                disabled={loading}
                className="flex-1 bg-[#14F195] text-black hover:bg-[#10c479] font-mono uppercase tracking-wide"
                data-testid="execute-swap-btn"
              >
                <Zap size={16} className="mr-2" />
                {loading ? "Swapping..." : "Execute Swap"}
              </Button>
            )}
          </div>
        </div>
        
        <div className="terminal-border rounded-md p-6 mt-6">
          <h3 className="text-lg font-mono font-semibold text-white mb-4">Swap Information</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <TrendingDown size={16} className="text-[#14F195] mt-0.5" />
              <p className="font-mono text-zinc-300">
                <span className="text-[#14F195]">Jupiter Aggregator:</span> Best rates across all Solana DEXs
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <Zap size={16} className="text-[#9945FF] mt-0.5" />
              <p className="font-mono text-zinc-300">
                <span className="text-[#9945FF]">Smart Routing:</span> Automatic route optimization
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <Coins size={16} className="text-[#3B82F6] mt-0.5" />
              <p className="font-mono text-zinc-300">
                <span className="text-[#3B82F6]">Slippage:</span> 0.5% default slippage tolerance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}