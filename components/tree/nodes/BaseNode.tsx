'use client';

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { supabase } from '@/lib/supabase/client';
import { debounce } from '@/lib/utils/debounce';
import { createChildNode } from '@/lib/utils/nodeOperations';
import VotingWidget from '../VotingWidget';
import ICEScoreWidget from '../ICEScoreWidget';

type TableName = 'outcomes' | 'opportunities' | 'solutions' | 'experiments';

interface BaseNodeProps extends NodeProps {
  data: {
    id: string;
    title: string;
    description?: string;
    canEdit?: boolean;
    userId?: string;
    onAddChild?: (parentId: string, parentType: string, position: { x: number; y: number }) => void;
    [key: string]: any;
  };
  nodeType: 'outcome' | 'opportunity' | 'solution' | 'experiment';
  color: string;
  icon?: React.ReactNode;
  tableName: TableName;
}

function BaseNode({ data, nodeType, color, icon, tableName, xPos, yPos }: BaseNodeProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [description, setDescription] = useState(data.description || '');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(data.title);
    setDescription(data.description || '');
  }, [data.title, data.description]);

  const saveNode = useCallback(
    debounce(async (updates: { title?: string; description?: string }) => {
      try {
        await supabase
          .from(tableName)
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id);
      } catch (error) {
        console.error('Error saving node:', error);
      }
    }, 500),
    [data.id, tableName]
  );

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== data.title) {
      saveNode({ title });
    }
  };

  const handleDescBlur = () => {
    setIsEditingDesc(false);
    if (description !== data.description) {
      saveNode({ description });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleInputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setTitle(data.title);
      setIsEditingTitle(false);
    }
  };

  const handleDescKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDescription(data.description || '');
      setIsEditingDesc(false);
    }
  };

  const handleDoubleClick = () => {
    if (data.canEdit) {
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  };

  return (
    <div
      className="rounded-lg shadow-lg border-2 min-w-[200px] max-w-[300px]"
      style={{ borderColor: color }}
    >
      <div
        className="px-4 py-3 rounded-t-lg text-white font-semibold text-sm flex items-center justify-between"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="uppercase">{nodeType}</span>
        </div>
        {data.canEdit && nodeType !== 'experiment' && (
          <button
            className="text-white hover:bg-white/20 rounded px-1"
            onClick={(e) => {
              e.stopPropagation();
              if (data.onAddChild) {
                data.onAddChild(data.id, nodeType, {
                  x: (xPos || 0) + 50,
                  y: (yPos || 0) + 200,
                });
              }
            }}
            title="Add child"
          >
            +
          </button>
        )}
      </div>
      <div className="bg-white px-4 py-3 rounded-b-lg">
        {isEditingTitle && data.canEdit ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="w-full font-semibold text-gray-900 text-sm border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 cursor-text"
            onDoubleClick={handleDoubleClick}
            title={data.canEdit ? 'Double-click to edit' : ''}
          >
            {title || 'Untitled'}
          </h3>
        )}
        {isEditingDesc && data.canEdit ? (
          <textarea
            ref={descInputRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            onKeyDown={handleDescKeyDown}
            className="w-full text-xs text-gray-600 border border-blue-500 rounded px-2 py-1 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          description && (
            <p
              className="text-xs text-gray-600 line-clamp-2 mt-1 cursor-text"
              onDoubleClick={() => {
                if (data.canEdit) {
                  setIsEditingDesc(true);
                  setTimeout(() => descInputRef.current?.focus(), 0);
                }
              }}
              title={data.canEdit ? 'Double-click to edit' : ''}
            >
              {description}
            </p>
          )
        )}
        {!description && !isEditingDesc && data.canEdit && (
          <button
            className="text-xs text-gray-400 hover:text-gray-600 mt-1"
            onClick={() => {
              setIsEditingDesc(true);
              setTimeout(() => descInputRef.current?.focus(), 0);
            }}
          >
            + Add description
          </button>
        )}
        {(nodeType === 'opportunity' || nodeType === 'solution') && (
          <VotingWidget
            nodeId={data.id}
            nodeType={nodeType}
            initialVoteCount={data.voteCount}
          />
        )}
        {nodeType === 'solution' && (
          <ICEScoreWidget
            solutionId={data.id}
            initialImpact={data.ice_impact}
            initialConfidence={data.ice_confidence}
            initialEase={data.ice_ease}
            canEdit={data.canEdit}
            compact={true}
          />
        )}
      </div>
      {nodeType !== 'outcome' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3"
          style={{ backgroundColor: color }}
        />
      )}
      {nodeType !== 'experiment' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}

export default memo(BaseNode);
