'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { Wrench } from 'lucide-react';

function SolutionNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      nodeType="solution"
      color="#10b981"
      icon={<Wrench className="h-4 w-4" />}
      tableName="solutions"
    />
  );
}

export default memo(SolutionNode);
