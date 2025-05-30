
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Code, Server, Terminal, Coffee, Zap, Settings, Monitor, LogIn, X, FileText } from 'lucide-react';
import TerminalWindow from './TerminalWindow';
import FloatingCodeSnippets from './FloatingCodeSnippets';
import ServerCard from './ServerCard';
import FastAPIGenerator from './FastAPIGenerator';
import ConfigurationViewer from './ConfigurationViewer';
import QuickLaunchModal from './QuickLaunchModal';
import { useServers } from '@/hooks/useServers';
import { useConfigurationFiles } from '@/hooks/useConfigurationFiles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showConfigViewer, setShowConfigViewer] = useState(false);
  const [showQuickLaunch, setShowQuickLaunch] = useState(false);
  const [selectedServerConfig, setSelectedServerConfig] = useState<any>(null);
  const { servers, loading, createServer } = useServers();
  const { generateConfigFiles } = useConfigurationFiles();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleCreateAPI = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create servers",
        variant: "destructive"
      });
      return;
    }

    setShowGenerator(true);
  };

  const handleQuickLaunch = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use Quick Launch",
        variant: "destructive"
      });
      return;
    }

    setShowQuickLaunch(true);
  };

  const handleGeneratorClose = () => {
    setShowGenerator(false);
  };

  const handleQuickLaunchClose = () => {
    setShowQuickLaunch(false);
  };

  const handleViewConfiguration = (server: any) => {
    // Generate example configuration for the server
    const exampleConfig = {
      name: server.name,
      description: server.description || 'Auto-generated FastAPI server',
      port: server.port,
      endpoints: [
        { id: '1', path: '/items', method: 'GET', description: 'Get all items' },
        { id: '2', path: '/items', method: 'POST', description: 'Create new item' }
      ],
      database: {
        enabled: true,
        type: 'sqlite'
      },
      middleware: ['cors']
    };

    const configFiles = generateConfigFiles(exampleConfig);
    setSelectedServerConfig({
      serverId: server.id,
      serverName: server.name,
      configFiles
    });
    setShowConfigViewer(true);
  };

  const handleConfigViewerClose = () => {
    setShowConfigViewer(false);
    setSelectedServerConfig(null);
  };

  const handleLogin = async () => {
    window.location.href = '/auth';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cyber-gradient relative overflow-hidden flex items-center justify-center">
        <FloatingCodeSnippets />
        
        <Card className="glass-panel border-cyber-primary/30 w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-cyber-primary flex items-center justify-center space-x-2">
              <Terminal className="h-6 w-6" />
              <span>FastAPI Control Center</span>
            </CardTitle>
            <CardDescription className="text-cyber-primary/70">
              Please log in to manage your FastAPI servers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogin}
              className="w-full cyber-button text-lg py-6"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Login / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showConfigViewer && selectedServerConfig) {
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
              <Button 
                variant="outline" 
                size="sm" 
                className="cyber-button"
                onClick={handleConfigViewerClose}
              >
                <X className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="text-sm text-cyber-primary/80">
                Welcome, {user.email}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="cyber-button"
                onClick={() => supabase.auth.signOut()}
              >
                <Settings className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Configuration Viewer */}
        <main className="p-6 max-w-7xl mx-auto relative z-10">
          <ConfigurationViewer
            serverId={selectedServerConfig.serverId}
            serverName={selectedServerConfig.serverName}
            configFiles={selectedServerConfig.configFiles}
            onClose={handleConfigViewerClose}
          />
        </main>

        {/* Ambient Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-primary/5 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-secondary/5 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyber-tertiary/5 rounded-full blur-3xl animate-pulse-glow"></div>
        </div>
      </div>
    );
  }

  if (showGenerator) {
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
              <Button 
                variant="outline" 
                size="sm" 
                className="cyber-button"
                onClick={handleGeneratorClose}
              >
                <X className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="text-sm text-cyber-primary/80">
                Welcome, {user.email}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="cyber-button"
                onClick={() => supabase.auth.signOut()}
              >
                <Settings className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* FastAPI Generator */}
        <main className="p-6 max-w-7xl mx-auto relative z-10">
          <FastAPIGenerator onGenerated={handleGeneratorClose} />
        </main>

        {/* Ambient Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-primary/5 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-secondary/5 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyber-tertiary/5 rounded-full blur-3xl animate-pulse-glow"></div>
        </div>
      </div>
    );
  }

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
            <div className="text-sm text-cyber-primary/80">
              Welcome, {user.email}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="cyber-button"
              onClick={() => supabase.auth.signOut()}
            >
              <Settings className="h-4 w-4 mr-2" />
              Logout
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
                onClick={handleCreateAPI}
                className="w-full cyber-button text-lg py-6"
                disabled={loading}
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
              <Button 
                onClick={handleQuickLaunch}
                className="w-full bg-cyber-secondary/20 border border-cyber-secondary text-cyber-secondary hover:bg-cyber-secondary/30 text-lg py-6"
              >
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
              Active Servers ({servers.length})
            </h2>
            <div className="space-y-4">
              {loading ? (
                <div className="text-cyber-primary/70">Loading servers...</div>
              ) : servers.length === 0 ? (
                <div className="text-cyber-primary/70">No servers created yet. Click "Create New API" to get started!</div>
              ) : (
                servers.map((server) => (
                  <ServerCard 
                    key={server.id} 
                    server={server} 
                    onViewConfiguration={handleViewConfiguration}
                  />
                ))
              )}
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

      {/* Quick Launch Modal */}
      <QuickLaunchModal
        isOpen={showQuickLaunch}
        onClose={handleQuickLaunchClose}
        onLaunched={() => {
          // Refresh the server list when a new server is launched
        }}
      />

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
