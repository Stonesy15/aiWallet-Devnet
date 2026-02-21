import React, { useState } from "react";
import axios from "axios";
import { API } from "../App";
import { motion } from "framer-motion";
import { Lock, User, Mail, Key, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function Auth() {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("auth_token") || "");
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      localStorage.setItem("auth_token", response.data.token);
      setToken(response.data.token);
      toast.success("Login successful!");
      loadApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, registerData);
      localStorage.setItem("auth_token", response.data.token);
      setToken(response.data.token);
      toast.success("Registration successful!");
      loadApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken("");
    setApiKeys([]);
    toast.success("Logged out");
  };
  
  const loadApiKeys = async () => {
    try {
      const response = await axios.get(`${API}/auth/api-keys`, {
        headers: { Authorization: `Bearer ${token || localStorage.getItem("auth_token")}` }
      });
      setApiKeys(response.data);
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  };
  
  const createApiKey = async () => {
    if (!newKeyName) {
      toast.error("Please enter a key name");
      return;
    }
    
    try {
      const response = await axios.post(
        `${API}/auth/api-keys`,
        { name: newKeyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("API key created!");
      navigator.clipboard.writeText(response.data.api_key);
      toast.info("API key copied to clipboard");
      
      setNewKeyName("");
      loadApiKeys();
    } catch (error) {
      toast.error("Failed to create API key");
    }
  };
  
  React.useEffect(() => {
    if (token) {
      loadApiKeys();
    }
  }, [token]);
  
  if (token) {
    return (
      <div className="space-y-8" data-testid="auth-page-logged-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-mono text-white tracking-tight">
              Authentication
            </h1>
            <p className="text-base text-zinc-400 mt-2">
              Manage your API keys and authentication
            </p>
          </div>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-[#27272a] bg-transparent hover:bg-[#27272a] text-white"
            data-testid="logout-btn"
          >
            Logout
          </Button>
        </div>
        
        <div className="terminal-border rounded-md p-6">
          <h3 className="text-lg font-mono font-semibold text-white mb-4">Create API Key</h3>
          
          <div className="flex gap-4">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Production API)"
              className="flex-1 bg-[#09090b] border-[#27272a] text-white font-mono"
              data-testid="api-key-name-input"
            />
            <Button
              onClick={createApiKey}
              className="bg-[#14F195] text-black hover:bg-[#10c479] font-mono uppercase tracking-wide"
              data-testid="create-api-key-btn"
            >
              <Key size={16} className="mr-2" />
              Create Key
            </Button>
          </div>
        </div>
        
        <div className="terminal-border rounded-md p-6">
          <h3 className="text-lg font-mono font-semibold text-white mb-4">Your API Keys</h3>
          
          {apiKeys.length === 0 ? (
            <p className="text-sm text-zinc-500 font-mono text-center py-8">
              No API keys yet. Create one above.
            </p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.key_id}
                  className="flex items-center justify-between p-4 bg-[#09090b] rounded border border-[#27272a]"
                  data-testid={`api-key-${key.key_id}`}
                >
                  <div>
                    <div className="text-sm font-mono text-white">{key.name}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-1">
                      Created: {new Date(key.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                      key.is_active
                        ? "bg-green-500/10 text-green-400 border border-green-500/30"
                        : "bg-red-500/10 text-red-400 border border-red-500/30"
                    }`}>
                      {key.is_active ? "ACTIVE" : "REVOKED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8" data-testid="auth-page">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold font-mono text-white tracking-tight">
          Authentication
        </h1>
        <p className="text-base text-zinc-400 mt-2">
          Login or register to access protected features
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#18181b] border border-[#27272a]">
            <TabsTrigger value="login" className="font-mono" data-testid="login-tab">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="font-mono" data-testid="register-tab">
              Register
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <div className="terminal-border rounded-md p-8 space-y-6">
              <div>
                <Label htmlFor="login-username" className="text-sm font-mono text-zinc-300">
                  Username
                </Label>
                <div className="relative mt-2">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="login-username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    placeholder="Enter username"
                    className="pl-10 bg-[#09090b] border-[#27272a] text-white font-mono"
                    data-testid="login-username-input"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="login-password" className="text-sm font-mono text-zinc-300">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    placeholder="Enter password"
                    className="pl-10 bg-[#09090b] border-[#27272a] text-white font-mono"
                    data-testid="login-password-input"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#14F195] text-black hover:bg-[#10c479] font-mono uppercase tracking-wide"
                data-testid="login-submit-btn"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <div className="terminal-border rounded-md p-8 space-y-6">
              <div>
                <Label htmlFor="register-username" className="text-sm font-mono text-zinc-300">
                  Username
                </Label>
                <div className="relative mt-2">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="register-username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                    placeholder="Choose username"
                    className="pl-10 bg-[#09090b] border-[#27272a] text-white font-mono"
                    data-testid="register-username-input"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="register-email" className="text-sm font-mono text-zinc-300">
                  Email
                </Label>
                <div className="relative mt-2">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    placeholder="Enter email"
                    className="pl-10 bg-[#09090b] border-[#27272a] text-white font-mono"
                    data-testid="register-email-input"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="register-password" className="text-sm font-mono text-zinc-300">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    placeholder="Choose password"
                    className="pl-10 bg-[#09090b] border-[#27272a] text-white font-mono"
                    data-testid="register-password-input"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-[#14F195] text-black hover:bg-[#10c479] font-mono uppercase tracking-wide"
                data-testid="register-submit-btn"
              >
                {loading ? "Creating account..." : "Register"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}