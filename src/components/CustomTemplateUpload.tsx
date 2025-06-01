
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Trash2 } from 'lucide-react';
import { useCustomTemplates } from '@/hooks/useCustomTemplates';
import { FastAPIConfig } from '@/types/fastapi';
import { useToast } from '@/hooks/use-toast';

interface CustomTemplateUploadProps {
  onTemplateSelect: (config: FastAPIConfig) => void;
}

const CustomTemplateUpload = ({ onTemplateSelect }: CustomTemplateUploadProps) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { templates, loading, saveTemplate, deleteTemplate } = useCustomTemplates();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setConfigFile(file);
      } else {
        toast({
          title: "Error",
          description: "Please select a valid JSON file",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!templateName.trim() || !configFile) {
      toast({
        title: "Error",
        description: "Please fill in the name and select a file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileContent = await configFile.text();
      const config = JSON.parse(fileContent) as FastAPIConfig;

      // Validate that the config has required fields
      if (!config.name || !config.port || !config.endpoints) {
        toast({
          title: "Error",
          description: "JSON file must contain name, port, and endpoints",
          variant: "destructive"
        });
        return;
      }

      await saveTemplate(templateName, templateDescription, config);
      
      // Reset form
      setTemplateName('');
      setTemplateDescription('');
      setConfigFile(null);
      setIsUploadOpen(false);
    } catch (error) {
      console.error('Error parsing config file:', error);
      toast({
        title: "Error",
        description: "Invalid JSON file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    onTemplateSelect(template.config);
  };

  const isPredefinedTemplate = (templateName: string) => {
    return ['Basic API', 'CRUD API', 'Auth API'].includes(templateName);
  };

  const userTemplates = templates.filter(template => !isPredefinedTemplate(template.name));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-cyber-primary">Custom Templates</h3>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="cyber-button">
              <Upload className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-cyber-primary/30">
            <DialogHeader>
              <DialogTitle className="text-cyber-primary">Upload Custom Template</DialogTitle>
              <DialogDescription className="text-cyber-primary/70">
                Upload a JSON file containing your template configuration
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name" className="text-cyber-primary">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="My API Template"
                  className="glass-panel border-cyber-primary/30"
                />
              </div>
              
              <div>
                <Label htmlFor="template-description" className="text-cyber-primary">Description (optional)</Label>
                <Textarea
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Description of your template"
                  className="glass-panel border-cyber-primary/30"
                />
              </div>
              
              <div>
                <Label htmlFor="config-file" className="text-cyber-primary">Configuration File (JSON)</Label>
                <Input
                  id="config-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="glass-panel border-cyber-primary/30"
                />
                {configFile && (
                  <p className="text-sm text-cyber-primary/70 mt-1">
                    Selected file: {configFile.name}
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={uploading || !templateName.trim() || !configFile}
                className="w-full cyber-button"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-cyber-primary/70">Loading templates...</div>
      ) : userTemplates.length === 0 ? (
        <div className="text-center py-8 text-cyber-primary/70">
          <FileText className="h-12 w-12 mx-auto mb-4 text-cyber-primary/40" />
          <p>No custom templates found.</p>
          <p>Click "Add Template" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userTemplates.map((template) => (
            <Card key={template.id} className="glass-panel border-cyber-primary/20 hover:border-cyber-primary/40 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-cyber-primary">{template.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {template.description && (
                  <CardDescription className="text-cyber-primary/70">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <span className="text-gray-400">Port: </span>
                  <span className="text-cyber-primary font-mono">{template.config.port}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Endpoints: </span>
                  <span className="text-cyber-primary">{template.config.endpoints?.length || 0}</span>
                </div>
                <Button
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full cyber-button"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomTemplateUpload;
