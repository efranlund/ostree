'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { FlaskConical } from 'lucide-react';

function ExperimentNode(props: NodeProps) {
  const statusColors: Record<string, string> = {
    planned: '#6b7280',
    running: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444',
  };
  
  const statusColor = statusColors[props.data?.status || 'planned'] || statusColors.planned;

  return (
    <BaseNode
      {...props}
      nodeType="experiment"
      color={statusColor}
      icon={<FlaskConical className="h-4 w-4" />}
      tableName="experiments"
    />
  );
}

export default memo(ExperimentNode);
