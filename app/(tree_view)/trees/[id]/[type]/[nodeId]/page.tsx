import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import NodeDetailsPage from '@/components/NodeDetailsPage';
import { Database } from '@/lib/supabase/database.types';

export default async function NodeDetailsPageRoute({
  params,
}: {
  params: Promise<{ id: string; type: string; nodeId: string }>;
}) {
  const { id: treeId, type, nodeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Validate node type
  if (!['opportunity', 'solution', 'experiment'].includes(type)) {
    notFound();
  }

  const nodeType = type as 'opportunity' | 'solution' | 'experiment';

  // Fetch tree to check access
  const { data: tree, error: treeError } = await supabase
    .from('trees')
    .select('*')
    .eq('id', treeId)
    .single();

  if (treeError || !tree) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Tree not found or you don't have access.</p>
      </div>
    );
  }

  // Check access
  const { data: member } = await supabase
    .from('tree_members')
    .select('role')
    .eq('tree_id', treeId)
    .eq('user_id', user.id)
    .single();

  const isOwner = tree.created_by === user.id;
  const hasAccess = isOwner || member || tree.is_public;

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">You don't have access to this tree.</p>
      </div>
    );
  }

  // Fetch node data
  const tableName = nodeType === 'opportunity' ? 'opportunities' : nodeType === 'solution' ? 'solutions' : 'experiments';
  
  const { data: node, error: nodeError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', nodeId)
    .single();

  if (nodeError || !node) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Node not found.</p>
      </div>
    );
  }

  // Verify node belongs to tree (for opportunities and solutions)
  if (nodeType === 'opportunity') {
    const opportunityNode = node as Database['public']['Tables']['opportunities']['Row'];
    const { data: outcome } = await supabase
      .from('outcomes')
      .select('tree_id')
      .eq('id', opportunityNode.outcome_id)
      .single();

    if (!outcome || outcome.tree_id !== treeId) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Node does not belong to this tree.</p>
        </div>
      );
    }
  } else if (nodeType === 'solution') {
    const solutionNode = node as Database['public']['Tables']['solutions']['Row'];
    // Check if it's a top-level solution (has opportunity_id) or sub-solution (has parent_solution_id)
    if (solutionNode.opportunity_id) {
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select('outcome_id')
        .eq('id', solutionNode.opportunity_id)
        .single();

      if (opportunity) {
        const { data: outcome } = await supabase
          .from('outcomes')
          .select('tree_id')
          .eq('id', opportunity.outcome_id)
          .single();

        if (!outcome || outcome.tree_id !== treeId) {
          return (
            <div className="text-center py-12">
              <p className="text-red-600">Node does not belong to this tree.</p>
            </div>
          );
        }
      }
    } else if (solutionNode.parent_solution_id) {
      // For sub-solutions, verify through parent chain
      let currentSolutionId = solutionNode.parent_solution_id;
      let foundRoot = false;
      
      // Traverse up the parent chain to find root solution
      while (currentSolutionId && !foundRoot) {
        const { data: parentSolution } = await supabase
          .from('solutions')
          .select('opportunity_id, parent_solution_id')
          .eq('id', currentSolutionId)
          .single();
        
        if (!parentSolution) break;
        
        if (parentSolution.opportunity_id) {
          // Found root solution, verify it belongs to tree
          const { data: opportunity } = await supabase
            .from('opportunities')
            .select('outcome_id')
            .eq('id', parentSolution.opportunity_id)
            .single();

          if (opportunity) {
            const { data: outcome } = await supabase
              .from('outcomes')
              .select('tree_id')
              .eq('id', opportunity.outcome_id)
              .single();

            if (!outcome || outcome.tree_id !== treeId) {
              return (
                <div className="text-center py-12">
                  <p className="text-red-600">Node does not belong to this tree.</p>
                </div>
              );
            }
            foundRoot = true;
          }
        } else if (parentSolution.parent_solution_id) {
          currentSolutionId = parentSolution.parent_solution_id;
        } else {
          break;
        }
      }
    }
  } else if (nodeType === 'experiment') {
    const experimentNode = node as Database['public']['Tables']['experiments']['Row'];
    const { data: solution } = await supabase
      .from('solutions')
      .select('opportunity_id')
      .eq('id', experimentNode.solution_id)
      .single();

    if (solution && solution.opportunity_id) {
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select('outcome_id')
        .eq('id', solution.opportunity_id)
        .single();

      if (opportunity) {
        const { data: outcome } = await supabase
          .from('outcomes')
          .select('tree_id')
          .eq('id', opportunity.outcome_id)
          .single();

        if (!outcome || outcome.tree_id !== treeId) {
          return (
            <div className="text-center py-12">
              <p className="text-red-600">Node does not belong to this tree.</p>
            </div>
          );
        }
      }
    }
  }

  // Fetch sub-solutions and parent solution breadcrumb if this is a solution
  let subSolutions: any[] = [];
  let parentSolution: any = null;
  let parentBreadcrumb: any[] = [];

  if (nodeType === 'solution') {
    const solutionNode = node as Database['public']['Tables']['solutions']['Row'];
    // Fetch sub-solutions
    const { data: subSols } = await supabase
      .from('solutions')
      .select('*')
      .eq('parent_solution_id', nodeId)
      .order('created_at', { ascending: true });
    
    subSolutions = subSols || [];

    // Build parent breadcrumb if this is a sub-solution
    if (solutionNode.parent_solution_id) {
      let currentParentId: string | null = solutionNode.parent_solution_id;
      const breadcrumb: any[] = [];

      while (currentParentId) {
        const { data: parent }: { data: { id: string; title: string; parent_solution_id: string | null } | null } = await supabase
          .from('solutions')
          .select('id, title, parent_solution_id')
          .eq('id', currentParentId)
          .single();

        if (!parent) break;

        breadcrumb.unshift(parent);
        currentParentId = parent.parent_solution_id;
      }

      parentBreadcrumb = breadcrumb;
      if (breadcrumb.length > 0) {
        parentSolution = breadcrumb[breadcrumb.length - 1];
      }
    }
  }

  return (
    <NodeDetailsPage
      treeId={treeId}
      nodeId={nodeId}
      nodeType={nodeType}
      initialData={node}
      subSolutions={subSolutions}
      parentSolution={parentSolution}
      parentBreadcrumb={parentBreadcrumb}
      userRole={isOwner ? 'owner' : (member?.role as 'owner' | 'editor' | 'viewer') || 'viewer'}
      userId={user.id}
    />
  );
}

