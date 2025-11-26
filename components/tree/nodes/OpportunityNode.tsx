'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { Lightbulb } from 'lucide-react';

function OpportunityNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      nodeType="opportunity"
      color="#f97316"
      icon={<Lightbulb className="h-4 w-4" />}
      tableName="opportunities"
    />
  );
}

export default memo(OpportunityNode);
