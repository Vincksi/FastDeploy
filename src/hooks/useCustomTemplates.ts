
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FastAPIConfig } from '@/types/fastapi';

export interface CustomTemplate {
  id: string;
  name: string;
  description?: string;
  config: FastAPIConfig;
  created_at: string;
  updated_at: string;
}

export const useCustomTemplates = () => {
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type the data properly with safe casting
      const typedTemplates: CustomTemplate[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        config: item.config as unknown as FastAPIConfig,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setTemplates(typedTemplates);
    } catch (error) {
      console.error('Error fetching custom templates:', error);
      toast({
        title: "Error",
        description: "Failed to load custom templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (name: string, description: string, config: FastAPIConfig) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to save a template",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('custom_templates')
        .insert({
          name,
          description,
          config: config as any, // Type assertion for JSONB
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template saved successfully!",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('custom_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully!",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  return {
    templates,
    loading,
    saveTemplate,
    deleteTemplate,
    refetch: fetchTemplates
  };
};
