import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Zap, Database, Shield, FileCode, Upload } from 'lucide-react';
import { useFastAPIGeneration } from '@/hooks/useFastAPIGeneration';
import { useServers } from '@/hooks/useServers';
import { useCustomTemplates } from '@/hooks/useCustomTemplates';
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
  const { templates, loading } = useCustomTemplates();

  const getTemplateIcon = (templateName: string) => {
    switch (templateName) {
      case 'Basic API':
        return <Server className="h-6 w-6 text-cyber-primary" />;
      case 'CRUD API':
        return <Database className="h-6 w-6 text-cyber-secondary" />;
      case 'Auth API':
        return <Shield className="h-6 w-6 text-cyber-tertiary" />;
      default:
        return <FileCode className="h-6 w-6 text-cyber-primary" />;
    }
  };

  const getTemplateFeatures = (templateName: string) => {
    switch (templateName) {
      case 'Basic API':
        return ['Health Check', 'Server Info', 'CORS Enabled'];
      case 'CRUD API':
        return ['Create/Read/Update/Delete', 'SQLite Database', 'Data Validation'];
      case 'Auth API':
        return ['User Registration', 'Login/Logout', 'Protected Routes'];
      default:
        return [];
    }
  };

  const isPredefinedTemplate = (templateName: string) => {
    return ['Basic API', 'CRUD API', 'Auth API'].includes(templateName);
  };

  const predefinedTemplates = templates.filter(template => isPredefinedTemplate(template.name));

  const handleTemplateSelect = (template: any) => {
    generateServer(template.config);
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
            Launch a server instantly from a template, custom configuration, or existing setup
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
              Custom
            </Button>
            <Button
              variant={selectedTab === 'existing' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('existing')}
              className={selectedTab === 'existing' ? 'cyber-button' : 'text-cyber-primary/70'}
            >
              <Server className="h-4 w-4 mr-2" />
              Existing Configs
            </Button>
          </div>

          {/* Templates Tab */}
          {selectedTab === 'templates' && (
            <div>
              {loading ? (
                <div className="text-cyber-primary/70">Loading templates...</div>
              ) : predefinedTemplates.length === 0 ? (
                <div className="text-center py-8 text-cyber-primary/70">
                  <FileCode className="h-12 w-12 mx-auto mb-4 text-cyber-primary/40" />
                  <p>No templates found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {predefinedTemplates.map((template) => (
                    <Card key={template.id} className="glass-panel border-cyber-primary/20 hover:border-cyber-primary/40 transition-all duration-300 cursor-pointer">
                      <CardHeader className="text-center">
                        <div className="flex justify-center mb-2">
                          {getTemplateIcon(template.name)}
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
                            {getTemplateFeatures(template.name).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-cyber-primary/30 text-cyber-primary/80">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          Default Port: <span className="text-cyber-primary font-mono">{template.config.port}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Endpoints: <span className="text-cyber-primary">{template.config.endpoints?.length || 0}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Database: <span className="text-cyber-primary">{template.config.database?.enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <Button
                          onClick={() => handleTemplateSelect(template)}
                          disabled={isGenerating}
                          className="w-full cyber-button"
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Launching...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Launch
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

          {/* Custom Templates Tab */}
          {selectedTab === 'custom' && (
            <CustomTemplateUpload onTemplateSelect={handleCustomTemplateSelect} />
          )}

          {/* Existing Configurations Tab */}
          {selectedTab === 'existing' && (
            <div className="space-y-4">
              {servers.length === 0 ? (
                <div className="text-center py-8 text-cyber-primary/70">
                  No existing servers found. Create your first server to use this feature.
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
                              Launching...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Launch Copy
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
