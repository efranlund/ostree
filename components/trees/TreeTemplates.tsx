'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { FileText, Sparkles } from 'lucide-react';

const templates = [
  {
    id: 'blank',
    name: 'Blank Tree',
    description: 'Start from scratch with an empty tree',
    icon: FileText,
  },
  {
    id: 'b2b-saas',
    name: 'B2B SaaS Product',
    description: 'Template for B2B SaaS product discovery',
    icon: Sparkles,
  },
];

export default function TreeTemplates({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createFromTemplate = async (templateId: string) => {
    setIsCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      let outcomeTitle = 'Business Outcome';
      let outcomeDescription = 'Describe the desired business outcome';

      if (templateId === 'b2b-saas') {
        outcomeTitle = 'Increase Customer Retention';
        outcomeDescription = 'Improve product stickiness and reduce churn';
      }

      // Create tree
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .insert({
          name: templateId === 'blank' ? 'New Opportunity Solution Tree' : (templates.find(t => t.id === templateId)?.name || 'New Opportunity Solution Tree'),
          created_by: user.id,
        })
        .select()
        .single();

      if (treeError) {
        console.error('Tree creation error:', treeError);
        throw treeError;
      }

      // Add user as owner
      const { error: memberError } = await supabase.from('tree_members').insert({
        tree_id: tree.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberError) {
        console.error('Member creation error:', memberError);
        throw memberError;
      }

      // Create default outcome
      const { error: outcomeError } = await supabase.from('outcomes').insert({
        tree_id: tree.id,
        title: outcomeTitle,
        description: outcomeDescription,
        position_x: 400,
        position_y: 100,
        created_by: user.id,
      });

      if (outcomeError) {
        console.error('Outcome creation error:', outcomeError);
        throw outcomeError;
      }

      onClose();
      router.push(`/trees/${tree.id}`);
    } catch (error) {
      console.error('Error creating tree from template:', error);
      alert(`Failed to create tree: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => createFromTemplate(template.id)}
              disabled={isCreating}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left disabled:opacity-50"
            >
              <div className="flex items-start space-x-3">
                <Icon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

