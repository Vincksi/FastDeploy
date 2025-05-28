
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, ExternalLink, Activity, Clock } from 'lucide-react';

interface Server {
  id: number;
  name: string;
  status: 'running' | 'stopped' | 'creating';
  port: number;
  uptime: string;
}

interface ServerCardProps {
  server: Server;
  onToggle: () => void;
}

const ServerCard = ({ server, onToggle }: ServerCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'stopped': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'creating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-3 w-3" />;
      case 'creating': return <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />;
      default: return <Square className="h-3 w-3" />;
    }
  };

  return (
    <Card className="glass-panel border-cyber-primary/20 hover:border-cyber-primary/40 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-cyber-primary">{server.name}</CardTitle>
          <Badge className={`${getStatusColor(server.status)} flex items-center space-x-1`}>
            {getStatusIcon(server.status)}
            <span className="capitalize">{server.status}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Port:</span>
            <span className="text-cyber-primary font-mono">{server.port}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Uptime:
            </span>
            <span className="text-cyber-tertiary">{server.uptime}</span>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={onToggle}
              disabled={server.status === 'creating'}
              className={`flex-1 ${
                server.status === 'running' 
                  ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30'
                  : 'cyber-button'
              }`}
              variant="outline"
            >
              {server.status === 'running' ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            
            {server.status === 'running' && (
              <Button
                variant="outline"
                size="sm"
                className="border-cyber-tertiary text-cyber-tertiary hover:bg-cyber-tertiary/20"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerCard;
