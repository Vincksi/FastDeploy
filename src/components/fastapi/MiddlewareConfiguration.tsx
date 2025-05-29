
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield } from 'lucide-react';
import { FastAPIConfig } from '@/types/fastapi';

interface MiddlewareConfigurationProps {
  config: FastAPIConfig;
  setConfig: React.Dispatch<React.SetStateAction<FastAPIConfig>>;
}

const MiddlewareConfiguration = ({ config, setConfig }: MiddlewareConfigurationProps) => {
  const toggleMiddleware = (middleware: string) => {
    setConfig(prev => ({
      ...prev,
      middleware: prev.middleware.includes(middleware)
        ? prev.middleware.filter(m => m !== middleware)
        : [...prev.middleware, middleware]
    }));
  };

  return (
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
  );
};

export default MiddlewareConfiguration;
