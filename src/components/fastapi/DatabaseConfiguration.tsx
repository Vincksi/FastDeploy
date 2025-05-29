
import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Database } from 'lucide-react';
import { FastAPIConfig } from '@/types/fastapi';

interface DatabaseConfigurationProps {
  config: FastAPIConfig;
  setConfig: React.Dispatch<React.SetStateAction<FastAPIConfig>>;
}

const DatabaseConfiguration = ({ config, setConfig }: DatabaseConfigurationProps) => {
  return (
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
  );
};

export default DatabaseConfiguration;
