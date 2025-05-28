
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Use the database type directly to ensure compatibility
type ServerLogRow = Database['public']['Tables']['server_logs']['Row'];

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
          const newLog = transformLogRow(payload.new as ServerLogRow);
          if (newLog) {
            setLogs(prev => [...prev, newLog].slice(-50)); // Keep last 50 logs
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [serverId]);

  const transformLogRow = (row: ServerLogRow): ServerLog | null => {
    // Type guard to ensure level is valid
    if (!['INFO', 'ERROR', 'WARNING', 'SUCCESS'].includes(row.level)) {
      return null;
    }
    
    return {
      id: row.id,
      server_id: row.server_id,
      level: row.level as 'INFO' | 'ERROR' | 'WARNING' | 'SUCCESS',
      message: row.message,
      timestamp: row.timestamp || new Date().toISOString()
    };
  };

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
      
      const transformedLogs = (data || [])
        .map(transformLogRow)
        .filter((log): log is ServerLog => log !== null);
      
      setLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading, refetch: fetchLogs };
};
