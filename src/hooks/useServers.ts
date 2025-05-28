
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Use the database type directly to ensure compatibility
type ServerRow = Database['public']['Tables']['servers']['Row'];

export interface Server {
  id: string;
  name: string;
  description?: string;
  status: 'running' | 'stopped' | 'creating' | 'error';
  port: number;
  repository_url?: string;
  environment_variables?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useServers = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchServers();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('servers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'servers'
        },
        () => {
          fetchServers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const transformServerRow = (row: ServerRow): Server => {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      status: row.status || 'stopped',
      port: row.port,
      repository_url: row.repository_url || undefined,
      environment_variables: row.environment_variables as Record<string, any> || {},
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString()
    };
  };

  const fetchServers = async () => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedServers = (data || []).map(transformServerRow);
      setServers(transformedServers);
    } catch (error) {
      console.error('Error fetching servers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch servers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createServer = async (params: {
    name: string;
    description?: string;
    repository_url?: string;
    environment_variables?: Record<string, any>;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-server', {
        body: { action: 'create', ...params }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Server is being created"
      });

      return data;
    } catch (error) {
      console.error('Error creating server:', error);
      toast({
        title: "Error",
        description: "Failed to create server",
        variant: "destructive"
      });
    }
  };

  const toggleServer = async (serverId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'running' ? 'stop' : 'start';
      
      const { error } = await supabase.functions.invoke('manage-server', {
        body: { action, serverId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Server ${action === 'start' ? 'started' : 'stopped'} successfully`
      });
    } catch (error) {
      console.error('Error toggling server:', error);
      toast({
        title: "Error",
        description: "Failed to toggle server",
        variant: "destructive"
      });
    }
  };

  const deleteServer = async (serverId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-server', {
        body: { action: 'delete', serverId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Server deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting server:', error);
      toast({
        title: "Error",
        description: "Failed to delete server",
        variant: "destructive"
      });
    }
  };

  return {
    servers,
    loading,
    createServer,
    toggleServer,
    deleteServer,
    refetch: fetchServers
  };
};
