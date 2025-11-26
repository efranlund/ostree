'use client';

import { ReactFlowProvider } from 'reactflow';
import TreeEditor from './TreeEditor';

export default function TreeEditorWrapper(props: any) {
  return (
    <ReactFlowProvider>
      <TreeEditor {...props} />
    </ReactFlowProvider>
  );
}

