
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from 'lucide-react';
import { FastAPIConfig, Endpoint } from '@/types/fastapi';

interface EndpointConfigurationProps {
  config: FastAPIConfig;
  setConfig: React.Dispatch<React.SetStateAction<FastAPIConfig>>;
}

const EndpointConfiguration = ({ config, setConfig }: EndpointConfigurationProps) => {
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

  return (
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
  );
};

export default EndpointConfiguration;
