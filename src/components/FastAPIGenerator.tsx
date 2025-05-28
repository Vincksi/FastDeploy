
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Code, Database, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Endpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
}

interface FastAPIConfig {
  name: string;
  description: string;
  endpoints: Endpoint[];
  database: {
    enabled: boolean;
    type: 'sqlite' | 'postgresql';
  };
  middleware: string[];
}

interface FastAPIGeneratorProps {
  onGenerated: () => void;
}

const FastAPIGenerator = ({ onGenerated }: FastAPIGeneratorProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<FastAPIConfig>({
    name: '',
    description: '',
    endpoints: [
      { id: '1', path: '/items', method: 'GET', description: 'Get all items' },
      { id: '2', path: '/items', method: 'POST', description: 'Create new item' }
    ],
    database: {
      enabled: true,
      type: 'sqlite'
    },
    middleware: ['cors']
  });

  const addEndpoint = () => {
    const newEndpoint: Endpoint = {
      id: Date.now().toString(),
      path: '/new-endpoint',
      method: 'GET',
      description: 'New endpoint description'
    };
    setConfig(prev => ({
      ...prev,
      endpoints: [...prev.endpoints, newEndpoint]
    }));
  };

  const removeEndpoint = (id: string) => {
    setConfig(prev => ({
      ...prev,
      endpoints: prev.endpoints.filter(ep => ep.id !== id)
    }));
  };

  const updateEndpoint = (id: string, field: keyof Endpoint, value: string) => {
    setConfig(prev => ({
      ...prev,
      endpoints: prev.endpoints.map(ep => 
        ep.id === id ? { ...ep, [field]: value } : ep
      )
    }));
  };

  const toggleMiddleware = (middleware: string) => {
    setConfig(prev => ({
      ...prev,
      middleware: prev.middleware.includes(middleware)
        ? prev.middleware.filter(m => m !== middleware)
        : [...prev.middleware, middleware]
    }));
  };

  const generateServer = async () => {
    if (!config.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a server name",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // First create the server entry
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .insert({
          name: config.name,
          description: config.description,
          port: 8000,
          status: 'creating'
        })
        .select()
        .single();

      if (serverError) throw serverError;

      // Then call the generation function
      const { error: functionError } = await supabase.functions.invoke('generate-fastapi', {
        body: {
          serverId: server.id,
          config: config
        }
      });

      if (functionError) throw functionError;

      toast({
        title: "Success",
        description: "FastAPI server generation started! Check the logs for progress.",
      });

      onGenerated();
    } catch (error) {
      console.error('Error generating server:', error);
      toast({
        title: "Error",
        description: "Failed to generate FastAPI server",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-cyber-primary/30">
        <CardHeader>
          <CardTitle className="text-cyber-primary flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>FastAPI Auto-Generator</span>
          </CardTitle>
          <CardDescription className="text-cyber-primary/70">
            Configure and generate a complete FastAPI server with auto-configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyber-primary">Basic Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="my-fastapi-server"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of your FastAPI server"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Endpoints Configuration */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-cyber-primary">API Endpoints</h3>
              <Button onClick={addEndpoint} size="sm" className="cyber-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
            </div>
            <div className="space-y-3">
              {config.endpoints.map((endpoint) => (
                <Card key={endpoint.id} className="border-cyber-primary/20">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-2">
                        <Label>Method</Label>
                        <select
                          value={endpoint.method}
                          onChange={(e) => updateEndpoint(endpoint.id, 'method', e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-input rounded-md"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <Label>Path</Label>
                        <Input
                          value={endpoint.path}
                          onChange={(e) => updateEndpoint(endpoint.id, 'path', e.target.value)}
                          placeholder="/api/endpoint"
                        />
                      </div>
                      <div className="md:col-span-6">
                        <Label>Description</Label>
                        <Input
                          value={endpoint.description}
                          onChange={(e) => updateEndpoint(endpoint.id, 'description', e.target.value)}
                          placeholder="Endpoint description"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Button
                          onClick={() => removeEndpoint(endpoint.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-400 hover:bg-red-400/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Database Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyber-primary flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Configuration</span>
            </h3>
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.database.enabled}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({
                    ...prev,
                    database: { ...prev.database, enabled: checked }
                  }))
                }
              />
              <Label>Enable database integration</Label>
            </div>
            {config.database.enabled && (
              <div>
                <Label>Database Type</Label>
                <select
                  value={config.database.type}
                  onChange={(e) => 
                    setConfig(prev => ({
                      ...prev,
                      database: { ...prev.database, type: e.target.value as 'sqlite' | 'postgresql' }
                    }))
                  }
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                >
                  <option value="sqlite">SQLite (recommended for development)</option>
                  <option value="postgresql">PostgreSQL</option>
                </select>
              </div>
            )}
          </div>

          {/* Middleware Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyber-primary flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Middleware</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {['cors', 'auth', 'logging', 'compression'].map((middleware) => (
                <Badge
                  key={middleware}
                  variant={config.middleware.includes(middleware) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    config.middleware.includes(middleware) 
                      ? 'bg-cyber-primary text-black' 
                      : 'border-cyber-primary text-cyber-primary hover:bg-cyber-primary/20'
                  }`}
                  onClick={() => toggleMiddleware(middleware)}
                >
                  {middleware.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            onClick={generateServer}
            disabled={isGenerating}
            className="w-full cyber-button text-lg py-6"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating FastAPI Server...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Generate FastAPI Server
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FastAPIGenerator;
