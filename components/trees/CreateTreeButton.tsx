'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Plus, LayoutTemplate } from 'lucide-react';
import TreeTemplates from './TreeTemplates';

export default function CreateTreeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create tree
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .insert({
          name,
          description: description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (treeError) throw treeError;

      // Add user as owner member
      const { error: memberError } = await supabase.from('tree_members').insert({
        tree_id: tree.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberError) {
        console.error('Error adding tree member:', memberError);
        throw memberError;
      }

      // Create default outcome
      const { error: outcomeError } = await supabase.from('outcomes').insert({
        tree_id: tree.id,
        title: 'Business Outcome',
        description: 'Describe the desired business outcome',
        position_x: 400,
        position_y: 100,
        created_by: user.id,
      });

      if (outcomeError) {
        console.error('Error creating outcome:', outcomeError);
        throw outcomeError;
      }

      setIsOpen(false);
      setName('');
      setDescription('');
      router.push(`/trees/${tree.id}`);
    } catch (error) {
      console.error('Error creating tree:', error);
      alert(`Failed to create tree: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-5 w-5 mr-2" />
        New Tree
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {showTemplates ? (
              <>
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Create New Tree
                  </h2>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowTemplates(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <TreeTemplates
                  onClose={() => {
                    setIsOpen(false);
                    setShowTemplates(false);
                  }}
                />
              </>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Create New Tree
                  </h2>
                </div>
                <div className="px-6 py-4">
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="w-full mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <LayoutTemplate className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 font-medium">Use a Template</span>
                  </button>
                  <div className="text-center text-sm text-gray-500 mb-4">or</div>
                </div>
                <form onSubmit={handleCreate} className="px-6 pb-4">
                  <div className="mb-4">
                    <label
                      htmlFor="tree-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tree Name *
                    </label>
                    <input
                      id="tree-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., User Onboarding Improvements"
                    />
                  </div>
                  <div className="mb-6">
                    <label
                      htmlFor="tree-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="tree-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional description..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setName('');
                        setDescription('');
                        setShowTemplates(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Tree'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
