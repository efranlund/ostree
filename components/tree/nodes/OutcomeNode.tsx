'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { Target } from 'lucide-react';

function OutcomeNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      nodeType="outcome"
      color="#3b82f6"
      icon={<Target className="h-4 w-4" />}
      tableName="outcomes"
    />
  );
}

export default memo(OutcomeNode);
