
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Terminal, Minimize2, Maximize2, X } from 'lucide-react';
import { useServerLogs } from '@/hooks/useServerLogs';

const TerminalWindow = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { logs, loading } = useServerLogs();

  const getLogColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARNING': return 'text-yellow-400';
      case 'SUCCESS': return 'text-green-400';
      case 'INFO': default: return 'text-cyan-400';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className={`terminal-window relative transition-all duration-300 ${isMaximized ? 'fixed inset-4 z-50' : ''}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-cyber-primary/20 bg-black/60">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-cyber-primary" />
          <span className="text-sm text-cyber-primary font-mono">terminal@fastapi-control</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 transition-colors"></button>
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 transition-colors flex items-center justify-center"
          >
            {isMaximized ? <Minimize2 className="w-2 h-2" /> : <Maximize2 className="w-2 h-2" />}
          </button>
          <button className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 transition-colors flex items-center justify-center">
            <X className="w-2 h-2" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-sm bg-black/80 backdrop-blur-sm h-64 overflow-y-auto">
        <div className="scan-line"></div>
        {loading ? (
          <div className="text-gray-500">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500">No logs available. Create and start a server to see logs.</div>
        ) : (
          logs.map((log, index) => (
            <div key={log.id || index} className="flex space-x-2 mb-1 opacity-90 hover:opacity-100 transition-opacity">
              <span className="text-gray-500">[{formatTime(log.timestamp)}]</span>
              <span className={`font-semibold ${getLogColor(log.level)}`}>{log.level}:</span>
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))
        )}
        <div className="flex items-center text-cyber-primary">
          <span className="mr-2">$</span>
          <div className="w-2 h-4 bg-cyber-primary animate-pulse"></div>
        </div>
      </div>
    </Card>
  );
};

export default TerminalWindow;
