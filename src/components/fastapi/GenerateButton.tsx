
import React from 'react';
import { Button } from "@/components/ui/button";
import { Zap } from 'lucide-react';

interface GenerateButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

const GenerateButton = ({ onGenerate, isGenerating }: GenerateButtonProps) => {
  return (
    <Button
      onClick={onGenerate}
      disabled={isGenerating}
      className="w-full cyber-button text-lg py-6"
    >
      {isGenerating ? (
        <>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          Generating FastAPI Server...
        </>
      ) : (
        <>
          <Zap className="h-5 w-5 mr-2" />
          Generate FastAPI Server
        </>
      )}
    </Button>
  );
};

export default GenerateButton;
