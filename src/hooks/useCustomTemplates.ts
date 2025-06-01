
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

const PREDEFINED_TEMPLATES: Omit<CustomTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Basic API',
    description: 'Simple FastAPI server with health check and info endpoints',
    config: {
      name: 'Basic-API',
      description: 'Basic FastAPI server with essential endpoints',
      port: 8000,
      endpoints: [
        { id: '1', path: '/health', method: 'GET', description: 'Health check endpoint' },
        { id: '2', path: '/info', method: 'GET', description: 'Server information' },
        { id: '3', path: '/version', method: 'GET', description: 'API version' }
      ],
      database: { enabled: false, type: 'sqlite' },
      middleware: ['cors']
    }
  },
  {
    name: 'CRUD API',
    description: 'Full CRUD operations with database integration',
    config: {
      name: 'CRUD-API',
      description: 'FastAPI server with full CRUD operations',
      port: 8001,
      endpoints: [
        { id: '1', path: '/items', method: 'GET', description: 'Get all items' },
        { id: '2', path: '/items', method: 'POST', description: 'Create new item' },
        { id: '3', path: '/items/{id}', method: 'GET', description: 'Get item by ID' },
        { id: '4', path: '/items/{id}', method: 'PUT', description: 'Update item' },
        { id: '5', path: '/items/{id}', method: 'DELETE', description: 'Delete item' },
        { id: '6', path: '/items/search', method: 'GET', description: 'Search items' }
      ],
      database: { enabled: true, type: 'sqlite' },
      middleware: ['cors']
    }
  },
  {
    name: 'Auth API',
    description: 'Authentication system with user management',
    config: {
      name: 'Auth-API',
      description: 'FastAPI server with authentication endpoints',
      port: 8002,
      endpoints: [
        { id: '1', path: '/register', method: 'POST', description: 'User registration' },
        { id: '2', path: '/login', method: 'POST', description: 'User login' },
        { id: '3', path: '/logout', method: 'POST', description: 'User logout' },
        { id: '4', path: '/profile', method: 'GET', description: 'Get user profile' },
        { id: '5', path: '/profile', method: 'PUT', description: 'Update user profile' },
        { id: '6', path: '/change-password', method: 'POST', description: 'Change password' }
      ],
      database: { enabled: true, type: 'sqlite' },
      middleware: ['cors', 'authentication']
    }
  }
];

export const useCustomTemplates = () => {
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const createPredefinedTemplates = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('User not authenticated, skipping template creation');
        return;
      }

      // Check if predefined templates already exist
      const { data: existingTemplates, error: fetchError } = await supabase
        .from('custom_templates')
        .select('name')
        .in('name', PREDEFINED_TEMPLATES.map(t => t.name));

      if (fetchError) throw fetchError;

      const existingNames = existingTemplates?.map(t => t.name) || [];
      const templatesToCreate = PREDEFINED_TEMPLATES.filter(
        template => !existingNames.includes(template.name)
      );

      if (templatesToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('custom_templates')
          .insert(
            templatesToCreate.map(template => ({
              name: template.name,
              description: template.description,
              config: template.config as any,
              user_id: user.id
            }))
          );

        if (insertError) throw insertError;
        
        console.log(`Created ${templatesToCreate.length} predefined templates`);
      }
    } catch (error) {
      console.error('Error creating predefined templates:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      // First, ensure predefined templates exist
      await createPredefinedTemplates();

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
