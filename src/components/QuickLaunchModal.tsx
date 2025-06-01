
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Zap, Database, Shield, FileCode, Upload } from 'lucide-react';
import { useFastAPIGeneration } from '@/hooks/useFastAPIGeneration';
import { useServers } from '@/hooks/useServers';
import CustomTemplateUpload from './CustomTemplateUpload';
import { FastAPIConfig } from '@/types/fastapi';

interface QuickLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunched: () => void;
}

const QuickLaunchModal = ({ isOpen, onClose, onLaunched }: QuickLaunchModalProps) => {
  const [selectedTab, setSelectedTab] = useState<'templates' | 'custom' | 'existing'>('templates');
  const { quickLaunchFromTemplate, quickLaunchFromExisting, generateServer, isGenerating } = useFastAPIGeneration(() => {
    onLaunched();
    onClose();
  });
  const { servers } = useServers();

  const templates = [
    {
      id: 'basic',
      name: 'Basic API',
      description: 'Simple FastAPI server with health check and info endpoints',
      icon: <Server className="h-6 w-6 text-cyber-primary" />,
      features: ['Health Check', 'Server Info', 'CORS Enabled'],
      port: 8000
    },
    {
      id: 'crud',
      name: 'CRUD API',
      description: 'Full CRUD operations with database integration',
      icon: <Database className="h-6 w-6 text-cyber-secondary" />,
      features: ['Create/Read/Update/Delete', 'SQLite Database', 'Data Validation'],
      port: 8001
    },
    {
      id: 'auth',
      name: 'Auth API',
      description: 'Authentication system with user management',
      icon: <Shield className="h-6 w-6 text-cyber-tertiary" />,
      features: ['User Registration', 'Login/Logout', 'Protected Routes'],
      port: 8002
    }
  ];

  const handleTemplateSelect = (templateId: 'basic' | 'crud' | 'auth') => {
    quickLaunchFromTemplate(templateId);
  };

  const handleCustomTemplateSelect = (config: FastAPIConfig) => {
    generateServer(config);
  };

  const handleExistingSelect = (serverId: string) => {
    quickLaunchFromExisting(serverId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto glass-panel border-cyber-primary/30">
        <DialogHeader>
          <DialogTitle className="text-cyber-primary flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Launch Server</span>
          </DialogTitle>
          <DialogDescription className="text-cyber-primary/70">
            Lancez un serveur instantanément depuis un template, configuration personnalisée ou existante
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Selection */}
          <div className="flex space-x-4 border-b border-cyber-primary/20">
            <Button
              variant={selectedTab === 'templates' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('templates')}
              className={selectedTab === 'templates' ? 'cyber-button' : 'text-cyber-primary/70'}
            >
              <FileCode className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button
              variant={selectedTab === 'custom' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('custom')}
              className={selectedTab === 'custom' ? 'cyber-button' : 'text-cyber-primary/70'}
            >
              <Upload className="h-4 w-4 mr-2" />
              Personnalisés
            </Button>
            <Button
              variant={selectedTab === 'existing' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('existing')}
              className={selectedTab === 'existing' ? 'cyber-button' : 'text-cyber-primary/70'}
            >
              <Server className="h-4 w-4 mr-2" />
              Configs Existantes
            </Button>
          </div>

          {/* Templates Tab */}
          {selectedTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="glass-panel border-cyber-primary/20 hover:border-cyber-primary/40 transition-all duration-300 cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      {template.icon}
                    </div>
                    <CardTitle className="text-cyber-primary">{template.name}</CardTitle>
                    <CardDescription className="text-cyber-primary/70">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Features:</div>
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-cyber-primary/30 text-cyber-primary/80">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Default Port: <span className="text-cyber-primary font-mono">{template.port}</span>
                    </div>
                    <Button
                      onClick={() => handleTemplateSelect(template.id as 'basic' | 'crud' | 'auth')}
                      disabled={isGenerating}
                      className="w-full cyber-button"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Lancement...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Lancer
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Custom Templates Tab */}
          {selectedTab === 'custom' && (
            <CustomTemplateUpload onTemplateSelect={handleCustomTemplateSelect} />
          )}

          {/* Existing Configurations Tab */}
          {selectedTab === 'existing' && (
            <div className="space-y-4">
              {servers.length === 0 ? (
                <div className="text-center py-8 text-cyber-primary/70">
                  Aucun serveur existant trouvé. Créez votre premier serveur pour utiliser cette fonctionnalité.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {servers.map((server) => (
                    <Card key={server.id} className="glass-panel border-cyber-primary/20 hover:border-cyber-primary/40 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-cyber-primary">{server.name}</CardTitle>
                          <Badge className={`${
                            server.status === 'running' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>
                            {server.status}
                          </Badge>
                        </div>
                        {server.description && (
                          <CardDescription className="text-cyber-primary/70">
                            {server.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm">
                          <span className="text-gray-400">Port: </span>
                          <span className="text-cyber-primary font-mono">{server.port}</span>
                        </div>
                        <Button
                          onClick={() => handleExistingSelect(server.id)}
                          disabled={isGenerating}
                          className="w-full cyber-button"
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Lancement...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Lancer Copie
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickLaunchModal;
