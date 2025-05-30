
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Copy, Eye, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConfigFile {
  name: string;
  content: string;
  language: string;
}

interface ConfigurationViewerProps {
  serverId: string;
  serverName: string;
  configFiles: ConfigFile[];
  onClose: () => void;
}

const ConfigurationViewer = ({ serverId, serverName, configFiles, onClose }: ConfigurationViewerProps) => {
  const [selectedFile, setSelectedFile] = useState(configFiles[0]?.name || '');
  const { toast } = useToast();

  const handleCopyContent = (content: string, fileName: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copié!",
      description: `Le contenu de ${fileName} a été copié dans le presse-papiers`,
    });
  };

  const handleDownloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Téléchargement",
      description: `${fileName} a été téléchargé`,
    });
  };

  const handleDownloadAll = () => {
    configFiles.forEach(file => {
      setTimeout(() => handleDownloadFile(file.content, file.name), 100);
    });
  };

  const selectedFileContent = configFiles.find(file => file.name === selectedFile);

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-cyber-primary/30">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-cyber-primary flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Fichiers de Configuration</span>
              </CardTitle>
              <CardDescription className="text-cyber-primary/70">
                Serveur: {serverName} | ID: {serverId.slice(0, 8)}...
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cyber-button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-cyber-primary text-cyber-primary">
                {configFiles.length} fichiers générés
              </Badge>
            </div>
            <Button
              onClick={handleDownloadAll}
              className="cyber-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger tout
            </Button>
          </div>

          <Tabs value={selectedFile} onValueChange={setSelectedFile}>
            <TabsList className="grid w-full grid-cols-4 bg-cyber-dark/20">
              {configFiles.map((file) => (
                <TabsTrigger 
                  key={file.name} 
                  value={file.name}
                  className="text-cyber-primary data-[state=active]:bg-cyber-primary/20"
                >
                  {file.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {configFiles.map((file) => (
              <TabsContent key={file.name} value={file.name} className="mt-4">
                <Card className="glass-panel border-cyber-secondary/30">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg text-cyber-secondary">
                        {file.name}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyContent(file.content, file.name)}
                          className="text-cyber-secondary border-cyber-secondary/50 hover:bg-cyber-secondary/10"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(file.content, file.name)}
                          className="text-cyber-secondary border-cyber-secondary/50 hover:bg-cyber-secondary/10"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-cyber-dark/40 text-cyber-primary text-sm p-4 rounded-lg overflow-x-auto max-h-96 border border-cyber-primary/20">
                      <code>{file.content}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationViewer;
