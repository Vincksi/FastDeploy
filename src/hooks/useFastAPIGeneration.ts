
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FastAPIConfig } from '@/types/fastapi';

export const useFastAPIGeneration = (onGenerated: () => void) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateServer = async (config: FastAPIConfig) => {
    if (!config.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a server name",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error", 
          description: "You must be logged in to create a server",
          variant: "destructive"
        });
        return;
      }

      // First create the server entry
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .insert({
          name: config.name,
          description: config.description,
          port: config.port,
          status: 'creating',
          user_id: user.id
        })
        .select()
        .single();

      if (serverError) throw serverError;

      // Then call the generation function
      const { error: functionError } = await supabase.functions.invoke('generate-fastapi', {
        body: {
          serverId: server.id,
          config: config
        }
      });

      if (functionError) throw functionError;

      toast({
        title: "Success",
        description: "FastAPI server generation started! Check the logs for progress.",
      });

      onGenerated();
    } catch (error) {
      console.error('Error generating server:', error);
      toast({
        title: "Error",
        description: "Failed to generate FastAPI server",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateServer, isGenerating };
};
