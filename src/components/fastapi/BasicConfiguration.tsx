
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FastAPIConfig } from '@/types/fastapi';

interface BasicConfigurationProps {
  config: FastAPIConfig;
  setConfig: React.Dispatch<React.SetStateAction<FastAPIConfig>>;
}

const BasicConfiguration = ({ config, setConfig }: BasicConfigurationProps) => {
  return (
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
  );
};

export default BasicConfiguration;
