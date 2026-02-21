import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Activity, 
  Shield, 
  Terminal,
  Menu,
  X,
  Home,
  Key,
  ArrowDownUp
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Wallets from "./pages/Wallets";
import Agents from "./pages/Agents";
import Transactions from "./pages/Transactions";
import Security from "./pages/Security";
import Auth from "./pages/Auth";
import Swap from "./pages/Swap";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/wallets", label: "Wallets", icon: Wallet },
    { path: "/agents", label: "Agents", icon: Activity },
    { path: "/swap", label: "Swap", icon: ArrowDownUp },
    { path: "/transactions", label: "Transactions", icon: Terminal },
    { path: "/security", label: "Security", icon: Shield },
    { path: "/auth", label: "Auth", icon: Key },
  ];
  
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />
      
      <aside 
        className={`fixed left-0 top-0 h-full w-64 bg-[#121212] border-r border-[#27272a] z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
          <h1 className="text-xl font-bold font-mono text-gradient-solana">
            AGENTIC_WALLET
          </h1>
          <button 
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={() => setIsOpen(false)}
            data-testid="close-sidebar-btn"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                  isActive
                    ? "bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30"
                    : "text-zinc-400 hover:text-white hover:bg-[#27272a]"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span className="font-mono text-sm uppercase tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#27272a]">
          <div className="text-xs text-zinc-500 font-mono space-y-1">
            <div>Network: <span className="text-[#14F195]">DEVNET</span></div>
            <div>Status: <span className="text-green-400">● ACTIVE</span></div>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur-md border-b border-[#27272a]">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <button 
          className="lg:hidden text-zinc-400 hover:text-white"
          onClick={onMenuClick}
          data-testid="open-menu-btn"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex-1 lg:flex-none">
          <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider">
            Solana Agentic Wallet System
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#18181b] rounded-md border border-[#27272a]">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono text-zinc-400">RPC Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
};

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="App">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="min-h-screen p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/wallets" element={<Wallets />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/swap" element={<Swap />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/security" element={<Security />} />
              <Route path="/auth" element={<Auth />} />
            </Routes>
          </motion.div>
        </main>
      </div>
      
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;