import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Code, Server, Terminal, Coffee, Zap, Settings, Monitor } from 'lucide-react';
import TerminalWindow from './TerminalWindow';
import FloatingCodeSnippets from './FloatingCodeSnippets';
import ServerCard from './ServerCard';

interface Server {
  id: number;
  name: string;
  status: 'running' | 'stopped' | 'creating';
  port: number;
  uptime: string;
}

const Dashboard = () => {
  const [servers, setServers] = useState<Server[]>([
    { id: 1, name: 'User API', status: 'running', port: 8000, uptime: '2h 34m' },
    { id: 2, name: 'Product API', status: 'stopped', port: 8001, uptime: '0m' },
    { id: 3, name: 'Analytics API', status: 'running', port: 8002, uptime: '1h 12m' },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const createNewAPI = () => {
    const newServer: Server = {
      id: servers.length + 1,
      name: `API-${servers.length + 1}`,
      status: 'creating' as const,
      port: 8000 + servers.length,
      uptime: '0m'
    };
    setServers([...servers, newServer]);
    
    // Simulate creation process
    setTimeout(() => {
      setServers(prev => 
        prev.map(s => s.id === newServer.id ? { ...s, status: 'running' as const } : s)
      );
    }, 3000);
  };

  const toggleServer = (id: number) => {
    setServers(servers.map(server => 
      server.id === id 
        ? { ...server, status: server.status === 'running' ? 'stopped' as const : 'running' as const }
        : server
    ));
  };

  return (
    <div className="min-h-screen bg-cyber-gradient relative overflow-hidden">
      <FloatingCodeSnippets />
      
      {/* Header */}
      <header className="relative z-10 p-6 border-b border-cyber-primary/20">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Terminal className="h-8 w-8 text-cyber-primary animate-glow" />
              <h1 className="text-2xl font-bold neon-text">FastAPI Control Center</h1>
            </div>
            <Badge variant="outline" className="border-cyber-primary text-cyber-primary animate-pulse-glow">
              v2.1.0
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-cyber-primary/80">
              <Coffee className="h-4 w-4" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            <Button variant="outline" size="sm" className="cyber-button">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-panel border-cyber-primary/30 hover:border-cyber-primary/60 transition-all duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-cyber-primary flex items-center justify-center space-x-2">
                <Code className="h-5 w-5" />
                <span>Create API</span>
              </CardTitle>
              <CardDescription className="text-cyber-primary/70">
                Generate a new FastAPI server with auto-configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={createNewAPI}
                className="w-full cyber-button text-lg py-6"
              >
                <Zap className="h-5 w-5 mr-2" />
                Create New API
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-cyber-secondary/30 hover:border-cyber-secondary/60 transition-all duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-cyber-secondary flex items-center justify-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Quick Launch</span>
              </CardTitle>
              <CardDescription className="text-cyber-secondary/70">
                Launch a server from template or existing config
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-cyber-secondary/20 border border-cyber-secondary text-cyber-secondary hover:bg-cyber-secondary/30 text-lg py-6">
                <Server className="h-5 w-5 mr-2" />
                Launch Server
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-cyber-tertiary/30 hover:border-cyber-tertiary/60 transition-all duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-cyber-tertiary flex items-center justify-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Monitor</span>
              </CardTitle>
              <CardDescription className="text-cyber-tertiary/70">
                Real-time monitoring and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-cyber-tertiary/20 border border-cyber-tertiary text-cyber-tertiary hover:bg-cyber-tertiary/30 text-lg py-6">
                <Monitor className="h-5 w-5 mr-2" />
                View Metrics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Server Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-cyber-primary mb-4 flex items-center">
              <Server className="h-5 w-5 mr-2" />
              Active Servers
            </h2>
            <div className="space-y-4">
              {servers.map((server) => (
                <ServerCard 
                  key={server.id} 
                  server={server} 
                  onToggle={() => toggleServer(server.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-cyber-primary mb-4 flex items-center">
              <Terminal className="h-5 w-5 mr-2" />
              Terminal Output
            </h2>
            <TerminalWindow />
          </div>
        </div>
      </main>

      {/* Ambient Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-primary/5 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-secondary/5 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyber-tertiary/5 rounded-full blur-3xl animate-pulse-glow"></div>
      </div>
    </div>
  );
};

export default Dashboard;
