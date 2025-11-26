'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  BackgroundVariant,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import OutcomeNode from './nodes/OutcomeNode';
import OpportunityNode from './nodes/OpportunityNode';
import SolutionNode from './nodes/SolutionNode';
import ExperimentNode from './nodes/ExperimentNode';
import { supabase } from '@/lib/supabase/client';
import { createChildNode, createOutcome } from '@/lib/utils/nodeOperations';
import { useRouter } from 'next/navigation';
import PresenceIndicator from './PresenceIndicator';
import ExportMenu from './ExportMenu';
import { Target } from 'lucide-react';

interface TreeEditorProps {
  tree: any;
  outcomes: any[];
  opportunities: any[];
  solutions: any[];
  experiments: any[];
  userRole: 'owner' | 'editor' | 'viewer';
  userId: string;
}

const nodeTypes: NodeTypes = {
  outcome: OutcomeNode,
  opportunity: OpportunityNode,
  solution: SolutionNode,
  experiment: ExperimentNode,
};

export default function TreeEditor({
  tree,
  outcomes,
  opportunities,
  solutions,
  experiments,
  userRole,
  userId,
}: TreeEditorProps) {
  // All users who can view the tree can also edit it
  const canEdit = true;
  const router = useRouter();
  
  const handleAddChild = useCallback(async (
    parentId: string,
    parentType: string,
    position: { x: number; y: number }
  ) => {
    try {
      // Solutions can now create sub-solutions (not just experiments)
      if (!canEdit) return;
      
      await createChildNode(parentId, parentType as any, userId, position);
      router.refresh();
    } catch (error) {
      console.error('Error creating child node:', error);
      alert('Failed to create child node. Please try again.');
    }
  }, [canEdit, userId, router]);

  const handleAddOutcome = useCallback(async () => {
    try {
      if (!canEdit) return;
      
      // Calculate position for new outcome (offset from existing outcomes)
      const newX = outcomes.length > 0 
        ? Math.max(...outcomes.map(o => o.position_x || 400)) + 400
        : 400;
      const newY = 100;
      
      await createOutcome(tree.id, userId, { x: newX, y: newY });
      router.refresh();
    } catch (error) {
      console.error('Error creating outcome:', error);
      alert('Failed to create outcome. Please try again.');
    }
  }, [canEdit, tree.id, userId, router, outcomes]);

  // Convert database records to React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add outcome nodes
    outcomes.forEach((outcome) => {
      nodes.push({
        id: outcome.id,
        type: 'outcome',
        position: {
          x: outcome.position_x || 400,
          y: outcome.position_y || 100,
        },
        data: {
          ...outcome,
          canEdit,
          userId,
          onAddChild: handleAddChild,
          treeId: tree.id,
        },
      });
    });

    // Add opportunity nodes and edges
    opportunities.forEach((opp) => {
      nodes.push({
        id: opp.id,
        type: 'opportunity',
        position: {
          x: opp.position_x || 200,
          y: opp.position_y || 300,
        },
        data: {
          ...opp,
          canEdit,
          userId,
          onAddChild: handleAddChild,
          treeId: tree.id,
        },
      });
      edges.push({
        id: `e-${opp.outcome_id}-${opp.id}`,
        source: opp.outcome_id,
        target: opp.id,
        type: 'smoothstep',
      });
    });

    // Add solution nodes and edges
    solutions.forEach((sol) => {
      nodes.push({
        id: sol.id,
        type: 'solution',
        position: {
          x: sol.position_x || 400,
          y: sol.position_y || 500,
        },
        data: {
          ...sol,
          canEdit,
          userId,
          onAddChild: handleAddChild,
          treeId: tree.id,
        },
      });
      // Add edge from opportunity (for top-level solutions)
      if (sol.opportunity_id) {
        edges.push({
          id: `e-${sol.opportunity_id}-${sol.id}`,
          source: sol.opportunity_id,
          target: sol.id,
          type: 'smoothstep',
        });
      }
      // Add edge from parent solution (for sub-solutions)
      if (sol.parent_solution_id) {
        edges.push({
          id: `e-${sol.parent_solution_id}-${sol.id}`,
          source: sol.parent_solution_id,
          target: sol.id,
          type: 'smoothstep',
        });
      }
    });

    // Add experiment nodes and edges
    experiments.forEach((exp) => {
      nodes.push({
        id: exp.id,
        type: 'experiment',
        position: {
          x: exp.position_x || 600,
          y: exp.position_y || 700,
        },
        data: {
          ...exp,
          canEdit,
          userId,
          treeId: tree.id,
        },
      });
      edges.push({
        id: `e-${exp.solution_id}-${exp.id}`,
        source: exp.solution_id,
        target: exp.id,
        type: 'smoothstep',
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [outcomes, opportunities, solutions, experiments, canEdit, userId, handleAddChild]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    async (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode || !sourceNode.type || !targetNode.type || !params.source || !params.target) return;

      const sourceType = sourceNode.type;
      const targetType = targetNode.type;

      // Optimistic update
      setEdges((eds) => addEdge(params, eds));

      try {
        // Define valid connections and update accordingly
        if (sourceType === 'outcome' && targetType === 'opportunity') {
          const { error } = await supabase
            .from('opportunities')
            .update({ outcome_id: params.source })
            .eq('id', params.target);
          if (error) throw error;
        } else if (sourceType === 'opportunity' && targetType === 'solution') {
          // Connect solution to opportunity (top-level solution)
          const { error } = await supabase
            .from('solutions')
            .update({ 
              opportunity_id: params.source,
              parent_solution_id: null 
            })
            .eq('id', params.target);
          if (error) throw error;
        } else if (sourceType === 'solution' && targetType === 'solution') {
          // Connect solution to solution (sub-solution)
          const { error } = await supabase
            .from('solutions')
            .update({ 
              parent_solution_id: params.source,
              opportunity_id: null 
            })
            .eq('id', params.target);
          if (error) throw error;
        } else if (sourceType === 'solution' && targetType === 'experiment') {
          const { error } = await supabase
            .from('experiments')
            .update({ solution_id: params.source })
            .eq('id', params.target);
          if (error) throw error;
        } else {
          // Invalid connection
          setEdges((eds) => eds.filter((e) => !(e.source === params.source && e.target === params.target)));
          return;
        }
      } catch (error) {
        console.error('Error saving connection:', error);
        // Rollback: remove the edge that was just added
        setEdges((eds) => eds.filter((e) => !(e.source === params.source && e.target === params.target)));
        alert('Failed to save connection');
      }
    },
    [nodes, setEdges]
  );

  // Handle node position updates
  const onNodesChangeWrapper = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
      
      // Save position when node is dragged
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.id) {
          const node = nodes.find((n) => n.id === change.id);
          if (node && node.type) {
            const { saveNodePosition } = require('@/lib/utils/nodeOperations');
            saveNodePosition(
              change.id,
              node.type as any,
              change.position.x,
              change.position.y
            );
          }
        }
      });
    },
    [nodes, onNodesChange]
  );

  // Update nodes when initial data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Set up real-time subscriptions
  useEffect(() => {
    const subscriptions: any[] = [];

    // Subscribe to outcomes changes
    const outcomesSub = supabase
      .channel('outcomes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'outcomes',
          filter: `tree_id=eq.${tree.id}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    subscriptions.push(outcomesSub);

    // Subscribe to opportunities changes
    const opportunitiesSub = supabase
      .channel('opportunities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunities',
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    subscriptions.push(opportunitiesSub);

    // Subscribe to solutions changes
    const solutionsSub = supabase
      .channel('solutions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solutions',
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    subscriptions.push(solutionsSub);

    // Subscribe to experiments changes
    const experimentsSub = supabase
      .channel('experiments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'experiments',
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    subscriptions.push(experimentsSub);

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach((sub) => {
        supabase.removeChannel(sub);
      });
    };
  }, [tree.id, router]);

  return (
    <div className="w-full h-full bg-white relative flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-start justify-between flex-none">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{tree.name}</h2>
          {tree.description && (
            <p className="text-sm text-gray-600 mt-1">{tree.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={handleAddOutcome}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Add a new outcome to this tree"
            >
              <Target className="h-4 w-4 mr-2" />
              Add Outcome
            </button>
          )}
          <ExportMenu
            tree={tree}
            userRole={userRole}
            onExportJSON={() => {
              const exportData = {
                tree: {
                  id: tree.id,
                  name: tree.name,
                },
                nodes: nodes.map((node) => ({
                  id: node.id,
                  type: node.type,
                  position: node.position,
                  data: {
                    title: node.data.title,
                    description: node.data.description,
                  },
                })),
                edges: edges.map((edge) => ({
                  id: edge.id,
                  source: edge.source,
                  target: edge.target,
                })),
                exportedAt: new Date().toISOString(),
              };

              const dataStr = JSON.stringify(exportData, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${tree.name.replace(/[^a-z0-9]/gi, '_')}_export.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
          />
        </div>
      </div>
      <div className="flex-1 relative">
        <PresenceIndicator treeId={tree.id} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWrapper}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.3,
            maxZoom: 0.75,
          }}
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'outcome') return '#3b82f6';
              if (node.type === 'opportunity') return '#f97316';
              if (node.type === 'solution') return '#10b981';
              return '#8b5cf6';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

