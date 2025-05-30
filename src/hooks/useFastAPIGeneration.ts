
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

  const quickLaunchFromTemplate = async (templateType: 'basic' | 'crud' | 'auth') => {
    setIsGenerating(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error", 
          description: "You must be logged in to create a server",
          variant: "destructive"
        });
        return;
      }

      // Define template configurations
      const templates = {
        basic: {
          name: `Basic-API-${Date.now()}`,
          description: 'Basic FastAPI server with essential endpoints',
          port: 8000,
          endpoints: [
            { id: '1', path: '/health', method: 'GET', description: 'Health check endpoint' },
            { id: '2', path: '/info', method: 'GET', description: 'Server information' }
          ],
          database: { enabled: false, type: 'sqlite' },
          middleware: ['cors']
        },
        crud: {
          name: `CRUD-API-${Date.now()}`,
          description: 'FastAPI server with full CRUD operations',
          port: 8001,
          endpoints: [
            { id: '1', path: '/items', method: 'GET', description: 'Get all items' },
            { id: '2', path: '/items', method: 'POST', description: 'Create new item' },
            { id: '3', path: '/items/{id}', method: 'GET', description: 'Get item by ID' },
            { id: '4', path: '/items/{id}', method: 'PUT', description: 'Update item' },
            { id: '5', path: '/items/{id}', method: 'DELETE', description: 'Delete item' }
          ],
          database: { enabled: true, type: 'sqlite' },
          middleware: ['cors']
        },
        auth: {
          name: `Auth-API-${Date.now()}`,
          description: 'FastAPI server with authentication endpoints',
          port: 8002,
          endpoints: [
            { id: '1', path: '/register', method: 'POST', description: 'User registration' },
            { id: '2', path: '/login', method: 'POST', description: 'User login' },
            { id: '3', path: '/profile', method: 'GET', description: 'Get user profile' },
            { id: '4', path: '/logout', method: 'POST', description: 'User logout' }
          ],
          database: { enabled: true, type: 'sqlite' },
          middleware: ['cors', 'authentication']
        }
      };

      const config = templates[templateType] as FastAPIConfig;

      // Create the server entry
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

      // Call the generation function
      const { error: functionError } = await supabase.functions.invoke('generate-fastapi', {
        body: {
          serverId: server.id,
          config: config
        }
      });

      if (functionError) throw functionError;

      toast({
        title: "Success",
        description: `${templateType.toUpperCase()} template server launched successfully!`,
      });

      onGenerated();
    } catch (error) {
      console.error('Error launching template server:', error);
      toast({
        title: "Error",
        description: "Failed to launch template server",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const quickLaunchFromExisting = async (existingServerId: string) => {
    setIsGenerating(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error", 
          description: "You must be logged in to create a server",
          variant: "destructive"
        });
        return;
      }

      // Get the existing server configuration
      const { data: existingServer, error: fetchError } = await supabase
        .from('servers')
        .select('*')
        .eq('id', existingServerId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingServer) {
        toast({
          title: "Error",
          description: "Could not find the selected server configuration",
          variant: "destructive"
        });
        return;
      }

      // Create a new server based on existing configuration
      const newConfig = {
        name: `${existingServer.name}-Copy-${Date.now()}`,
        description: existingServer.description || 'Copy of existing server',
        port: existingServer.port + 1, // Increment port to avoid conflicts
        endpoints: [
          { id: '1', path: '/items', method: 'GET', description: 'Get all items' },
          { id: '2', path: '/items', method: 'POST', description: 'Create new item' }
        ],
        database: { enabled: true, type: 'sqlite' },
        middleware: ['cors']
      };

      // Create the new server entry
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .insert({
          name: newConfig.name,
          description: newConfig.description,
          port: newConfig.port,
          status: 'creating',
          user_id: user.id,
          environment_variables: existingServer.environment_variables
        })
        .select()
        .single();

      if (serverError) throw serverError;

      // Call the generation function
      const { error: functionError } = await supabase.functions.invoke('generate-fastapi', {
        body: {
          serverId: server.id,
          config: newConfig
        }
      });

      if (functionError) throw functionError;

      toast({
        title: "Success",
        description: "Server launched from existing configuration!",
      });

      onGenerated();
    } catch (error) {
      console.error('Error launching from existing config:', error);
      toast({
        title: "Error",
        description: "Failed to launch server from existing configuration",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return { 
    generateServer, 
    isGenerating,
    quickLaunchFromTemplate,
    quickLaunchFromExisting
  };
};
