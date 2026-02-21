import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { motion } from "framer-motion";
import { Terminal, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const TransactionRow = ({ log }) => {
  const getStatusColor = (success) => {
    return success 
      ? "bg-green-500/10 text-green-400 border-green-500/30"
      : "bg-red-500/10 text-red-400 border-red-500/30";
  };
  
  const getExplorerUrl = (signature) => {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  };
  
  return (
    <motion.tr 
      className="border-b border-[#27272a] hover:bg-[#27272a]/30 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`transaction-row-${log.timestamp}`}
    >
      <td className="p-4">
        <div className="flex items-center gap-2">
          {log.success ? (
            <CheckCircle size={16} className="text-green-400" />
          ) : (
            <XCircle size={16} className="text-red-400" />
          )}
          <span className={`text-xs font-mono px-2 py-1 rounded border ${getStatusColor(log.success)}`}>
            {log.success ? "SUCCESS" : "FAILED"}
          </span>
        </div>
      </td>
      
      <td className="p-4">
        <span className="text-sm font-mono text-white uppercase">{log.action_type}</span>
      </td>
      
      <td className="p-4">
        <div className="text-sm font-mono text-zinc-300">
          {log.params?.amount ? `${log.params.amount} SOL` : "-"}
        </div>
      </td>
      
      <td className="p-4">
        <div className="text-xs font-mono text-zinc-400">
          {new Date(log.timestamp).toLocaleString()}
        </div>
      </td>
      
      <td className="p-4">
        {log.result?.signature ? (
          <a
            href={getExplorerUrl(log.result.signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-mono text-[#14F195] hover:text-[#10c479] transition-colors"
            data-testid={`explorer-link-${log.timestamp}`}
          >
            View on Explorer
            <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-xs font-mono text-zinc-600">N/A</span>
        )}
      </td>
    </motion.tr>
  );
};

export default function Transactions() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  useEffect(() => {
    loadTransactions();
    const interval = setInterval(loadTransactions, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const loadTransactions = async () => {
    try {
      const response = await axios.get(`${API}/audit/logs?limit=50`);
      setLogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading transactions:", error);
      if (loading) {
        toast.error("Failed to load transactions");
        setLoading(false);
      }
    }
  };
  
  const filteredLogs = logs.filter(log => {
    if (filter === "all") return true;
    if (filter === "success") return log.success;
    if (filter === "failed") return !log.success;
    return true;
  });
  
  const stats = {
    total: logs.length,
    successful: logs.filter(l => l.success).length,
    failed: logs.filter(l => !l.success).length
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="text-zinc-400 font-mono animate-pulse">Loading transactions...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8" data-testid="transactions-page">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold font-mono text-white tracking-tight">
          Transactions
        </h1>
        <p className="text-base text-zinc-400 mt-2">
          Complete audit trail of all wallet operations on Solana devnet
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="terminal-border rounded-md p-4">
          <div className="text-sm text-zinc-400 font-mono uppercase mb-2">Total</div>
          <div className="text-3xl font-bold font-mono text-white">{stats.total}</div>
        </div>
        
        <div className="terminal-border rounded-md p-4">
          <div className="text-sm text-zinc-400 font-mono uppercase mb-2">Successful</div>
          <div className="text-3xl font-bold font-mono text-green-400">{stats.successful}</div>
        </div>
        
        <div className="terminal-border rounded-md p-4">
          <div className="text-sm text-zinc-400 font-mono uppercase mb-2">Failed</div>
          <div className="text-3xl font-bold font-mono text-red-400">{stats.failed}</div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-md font-mono text-sm uppercase tracking-wide transition-colors ${
            filter === "all"
              ? "bg-[#14F195] text-black"
              : "bg-[#27272a] text-white hover:bg-[#3f3f46]"
          }`}
          data-testid="filter-all-btn"
        >
          All
        </button>
        <button
          onClick={() => setFilter("success")}
          className={`px-4 py-2 rounded-md font-mono text-sm uppercase tracking-wide transition-colors ${
            filter === "success"
              ? "bg-green-500 text-black"
              : "bg-[#27272a] text-white hover:bg-[#3f3f46]"
          }`}
          data-testid="filter-success-btn"
        >
          Successful
        </button>
        <button
          onClick={() => setFilter("failed")}
          className={`px-4 py-2 rounded-md font-mono text-sm uppercase tracking-wide transition-colors ${
            filter === "failed"
              ? "bg-red-500 text-black"
              : "bg-[#27272a] text-white hover:bg-[#3f3f46]"
          }`}
          data-testid="filter-failed-btn"
        >
          Failed
        </button>
      </div>
      
      <div className="terminal-border rounded-md overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12" data-testid="no-transactions-message">
            <Terminal size={48} className="mx-auto text-zinc-600 mb-4" />
            <h3 className="text-lg font-mono text-zinc-400 mb-2">No transactions yet</h3>
            <p className="text-sm text-zinc-500 font-mono">
              Transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#18181b] border-b border-[#27272a]">
                <tr>
                  <th className="p-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="p-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="p-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="p-4 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    Explorer
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <TransactionRow key={idx} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}