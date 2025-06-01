
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
      
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching custom templates:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les templates personnalisés",
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
          title: "Erreur",
          description: "Vous devez être connecté pour sauvegarder un template",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('custom_templates')
        .insert({
          name,
          description,
          config,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Template sauvegardé avec succès !",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le template",
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
        title: "Succès",
        description: "Template supprimé avec succès !",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le template",
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
