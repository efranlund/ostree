'use client';

import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface LinearLinkProps {
  nodeId: string;
  nodeType: 'opportunity' | 'solution' | 'experiment';
  initialUrl?: string | null;
  canEdit?: boolean;
  onUpdate?: (url: string | null) => void;
}

export default function LinearLink({
  nodeId,
  nodeType,
  initialUrl,
  canEdit = true,
  onUpdate,
}: LinearLinkProps) {
  const [url, setUrl] = useState(initialUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (newUrl: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from(nodeType === 'opportunity' ? 'opportunities' : nodeType === 'solution' ? 'solutions' : 'experiments')
        .update({ 
          linear_ticket_url: newUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', nodeId);

      if (error) throw error;

      setUrl(newUrl);
      setIsEditing(false);
      onUpdate?.(newUrl || null);
    } catch (error) {
      console.error('Error saving Linear URL:', error);
      alert('Failed to save Linear URL');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setUrl(initialUrl || '');
    setIsEditing(false);
  };

  if (isEditing && canEdit) {
    return (
      <div className="flex items-center gap-2">
        <ExternalLink className="w-4 h-4 text-gray-500" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://linear.app/..."
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave(url);
            } else if (e.key === 'Escape') {
              handleCancel();
            }
          }}
          autoFocus
        />
        <button
          onClick={() => handleSave(url)}
          disabled={isSaving}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (url) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View in Linear</span>
        </a>
        {canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  if (canEdit) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
      >
        <ExternalLink className="w-4 h-4" />
        <span>Link Linear Issue</span>
      </button>
    );
  }

  return null;
}

