
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from 'lucide-react';
import { FastAPIConfig } from '@/types/fastapi';
import { useFastAPIGeneration } from '@/hooks/useFastAPIGeneration';
import BasicConfiguration from './fastapi/BasicConfiguration';
import EndpointConfiguration from './fastapi/EndpointConfiguration';
import DatabaseConfiguration from './fastapi/DatabaseConfiguration';
import MiddlewareConfiguration from './fastapi/MiddlewareConfiguration';
import GenerateButton from './fastapi/GenerateButton';

interface FastAPIGeneratorProps {
  onGenerated: () => void;
}

const FastAPIGenerator = ({ onGenerated }: FastAPIGeneratorProps) => {
  const [config, setConfig] = useState<FastAPIConfig>({
    name: '',
    description: '',
    endpoints: [
      { id: '1', path: '/items', method: 'GET', description: 'Get all items' },
      { id: '2', path: '/items', method: 'POST', description: 'Create new item' }
    ],
    database: {
      enabled: true,
      type: 'sqlite'
    },
    middleware: ['cors']
  });

  const { generateServer, isGenerating } = useFastAPIGeneration(onGenerated);

  const handleGenerate = () => {
    generateServer(config);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-cyber-primary/30">
        <CardHeader>
          <CardTitle className="text-cyber-primary flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>FastAPI Auto-Generator</span>
          </CardTitle>
          <CardDescription className="text-cyber-primary/70">
            Configure and generate a complete FastAPI server with auto-configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <BasicConfiguration config={config} setConfig={setConfig} />
          <EndpointConfiguration config={config} setConfig={setConfig} />
          <DatabaseConfiguration config={config} setConfig={setConfig} />
          <MiddlewareConfiguration config={config} setConfig={setConfig} />
          <GenerateButton onGenerate={handleGenerate} isGenerating={isGenerating} />
        </CardContent>
      </Card>
    </div>
  );
};

export default FastAPIGenerator;
