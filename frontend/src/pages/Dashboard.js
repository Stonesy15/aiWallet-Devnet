import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Activity, 
  TrendingUp, 
  Shield,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { toast } from "sonner";

const StatCard = ({ icon: Icon, label, value, trend, color = "green" }) => {
  const colorClasses = {
    green: "text-[#14F195] border-[#14F195]/30 bg-[#14F195]/5",
    purple: "text-[#9945FF] border-[#9945FF]/30 bg-[#9945FF]/5",
    blue: "text-[#3B82F6] border-[#3B82F6]/30 bg-[#3B82F6]/5",
  };
  
  return (
    <motion.div 
      className="terminal-border rounded-md p-6 card-hover"
      whileHover={{ scale: 1.02 }}
      data-testid={`stat-card-${label.toLowerCase().replace(' ', '-')}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-md ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-green-400 font-mono">
            <TrendingUp size={14} />
            {trend}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <div className="text-3xl font-bold font-mono text-white">{value}</div>
        <div className="text-sm text-zinc-400 mt-1 uppercase tracking-wide">{label}</div>
      </div>
    </motion.div>
  );
};

const RecentActivity = ({ activities }) => {
  return (
    <div className="terminal-border rounded-md p-6" data-testid="recent-activity">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-mono font-semibold text-white">Recent Activity</h3>
        <Clock size={18} className="text-zinc-400" />
      </div>
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 font-mono text-sm">
            No activity yet
          </div>
        ) : (
          activities.map((activity, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-3 bg-[#09090b] rounded border border-[#27272a] hover:border-[#14F195]/30 transition-colors"
              data-testid={`activity-item-${idx}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#14F195]" />
                <div>
                  <div className="text-sm font-mono text-white">{activity.action_type}</div>
                  <div className="text-xs text-zinc-500 font-mono">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className={`text-xs font-mono px-2 py-1 rounded ${
                activity.success 
                  ? "bg-green-500/10 text-green-400 border border-green-500/30" 
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
              }`}>
                {activity.success ? "SUCCESS" : "FAILED"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalAgents: 0,
    totalTransactions: 0,
    totalBalance: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      const [walletsRes, agentsRes, logsRes] = await Promise.all([
        axios.get(`${API}/wallets`),
        axios.get(`${API}/agents`),
        axios.get(`${API}/audit/logs?limit=5`)
      ]);
      
      const wallets = walletsRes.data;
      const totalBalance = wallets.reduce((sum, w) => sum + (w.balances?.SOL || 0), 0);
      
      setStats({
        totalWallets: wallets.length,
        totalAgents: agentsRes.data.length,
        totalTransactions: logsRes.data.length,
        totalBalance: totalBalance.toFixed(4)
      });
      
      setActivities(logsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="text-zinc-400 font-mono animate-pulse">Loading dashboard...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold font-mono text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-base text-zinc-400 mt-2">
          Monitor your agentic wallet system on Solana devnet
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Wallet}
          label="Total Wallets"
          value={stats.totalWallets}
          color="green"
        />
        <StatCard 
          icon={Activity}
          label="Active Agents"
          value={stats.totalAgents}
          color="purple"
        />
        <StatCard 
          icon={ArrowUpRight}
          label="Transactions"
          value={stats.totalTransactions}
          color="blue"
        />
        <StatCard 
          icon={Shield}
          label="Total Balance"
          value={`${stats.totalBalance} SOL`}
          color="green"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={activities} />
        
        <div className="terminal-border rounded-md p-6" data-testid="system-status">
          <h3 className="text-lg font-mono font-semibold text-white mb-4">System Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#09090b] rounded border border-[#27272a]">
              <span className="text-sm font-mono text-zinc-300">Solana RPC</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-green-400">CONNECTED</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-[#09090b] rounded border border-[#27272a]">
              <span className="text-sm font-mono text-zinc-300">Network</span>
              <span className="text-xs font-mono text-[#14F195]">DEVNET</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-[#09090b] rounded border border-[#27272a]">
              <span className="text-sm font-mono text-zinc-300">Key Management</span>
              <span className="text-xs font-mono text-[#9945FF]">ENCRYPTED</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-[#09090b] rounded border border-[#27272a]">
              <span className="text-sm font-mono text-zinc-300">Audit Logging</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-green-400">ENABLED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}