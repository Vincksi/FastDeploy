
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServerLog {
  id: string;
  server_id: string;
  level: 'INFO' | 'ERROR' | 'WARNING' | 'SUCCESS';
  message: string;
  timestamp: string;
}

export const useServerLogs = (serverId?: string) => {
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    // Set up realtime subscription for logs
    const channel = supabase
      .channel('server-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'server_logs',
          filter: serverId ? `server_id=eq.${serverId}` : undefined
        },
        (payload) => {
          setLogs(prev => [...prev, payload.new as ServerLog].slice(-50)); // Keep last 50 logs
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [serverId]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('server_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (serverId) {
        query = query.eq('server_id', serverId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading, refetch: fetchLogs };
};
