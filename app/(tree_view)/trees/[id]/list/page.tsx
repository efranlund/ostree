import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TreeListView from '@/components/tree/TreeListView';

export default async function TreeListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch tree with all related data
  const { data: tree, error: treeError } = await supabase
    .from('trees')
    .select('*')
    .eq('id', id)
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
    .eq('tree_id', id)
    .eq('user_id', user.id)
    .single();

  const isOwner = tree.created_by === user.id;
  const hasAccess =
    isOwner || member || tree.is_public;

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">You don't have access to this tree.</p>
      </div>
    );
  }

  // Fetch all tree data with hierarchical structure
  const { data: outcomes } = await supabase
    .from('outcomes')
    .select('*')
    .eq('tree_id', id)
    .order('created_at', { ascending: true });

  const outcomeIds = outcomes?.map((o) => o.id) || [];

  const { data: opportunities } = outcomeIds.length > 0
    ? await supabase
        .from('opportunities')
        .select('*')
        .in('outcome_id', outcomeIds)
        .order('created_at', { ascending: true })
    : { data: [] };

  const opportunityIds = opportunities?.map((o) => o.id) || [];

  // Get vote counts for opportunities
  const { data: oppVotes } = opportunityIds.length > 0
    ? await supabase
        .from('votes')
        .select('node_id')
        .in('node_id', opportunityIds)
        .eq('node_type', 'opportunity')
    : { data: [] };

  const voteCountsByNodeId: Record<string, number> = {};
  oppVotes?.forEach((vote) => {
    voteCountsByNodeId[vote.node_id] = (voteCountsByNodeId[vote.node_id] || 0) + 1;
  });

  const opportunitiesWithVotes = opportunities?.map((opp) => ({
    ...opp,
    voteCount: voteCountsByNodeId[opp.id] || 0,
  })) || [];

  // Fetch all solutions (both top-level and sub-solutions)
  // First get top-level solutions
  const { data: topLevelSolutions } = opportunityIds.length > 0
    ? await supabase
        .from('solutions')
        .select('*')
        .in('opportunity_id', opportunityIds)
        .order('created_at', { ascending: true })
    : { data: [] };

  // Get all solution IDs to find sub-solutions
  const topLevelSolutionIds = topLevelSolutions?.map((s) => s.id) || [];
  
  // Fetch first level of sub-solutions
  const { data: firstLevelSubSolutions } = topLevelSolutionIds.length > 0
    ? await supabase
        .from('solutions')
        .select('*')
        .in('parent_solution_id', topLevelSolutionIds)
        .order('created_at', { ascending: true })
    : { data: [] };

  // Get IDs of first-level sub-solutions to find nested ones
  const firstLevelSubSolutionIds = firstLevelSubSolutions?.map((s) => s.id) || [];
  
  // Fetch second level of sub-solutions (nested sub-solutions)
  const { data: secondLevelSubSolutions } = firstLevelSubSolutionIds.length > 0
    ? await supabase
        .from('solutions')
        .select('*')
        .in('parent_solution_id', firstLevelSubSolutionIds)
        .order('created_at', { ascending: true })
    : { data: [] };

  // Combine all solutions (supporting up to 3 levels deep)
  const solutions = [
    ...(topLevelSolutions || []),
    ...(firstLevelSubSolutions || []),
    ...(secondLevelSubSolutions || []),
  ];

  const solutionIds = solutions?.map((s) => s.id) || [];

  // Get vote counts for solutions
  const { data: solVotes } = solutionIds.length > 0
    ? await supabase
        .from('votes')
        .select('node_id')
        .in('node_id', solutionIds)
        .eq('node_type', 'solution')
    : { data: [] };

  const solVoteCountsByNodeId: Record<string, number> = {};
  solVotes?.forEach((vote) => {
    solVoteCountsByNodeId[vote.node_id] = (solVoteCountsByNodeId[vote.node_id] || 0) + 1;
  });

  const solutionsWithVotes = solutions?.map((sol) => ({
    ...sol,
    voteCount: solVoteCountsByNodeId[sol.id] || 0,
    iceScore: sol.ice_impact && sol.ice_confidence && sol.ice_ease
      ? sol.ice_impact * sol.ice_confidence * sol.ice_ease
      : null,
  })) || [];

  // Experiments can be attached to any solution (including sub-solutions)
  const allSolutionIds = solutions.map((s) => s.id);
  const { data: experiments } = allSolutionIds.length > 0
    ? await supabase
        .from('experiments')
        .select('*')
        .in('solution_id', allSolutionIds)
        .order('created_at', { ascending: true })
    : { data: [] };

  return (
    <TreeListView
      tree={tree}
      outcomes={outcomes || []}
      opportunities={opportunitiesWithVotes}
      solutions={solutionsWithVotes}
      experiments={experiments || []}
      userRole={isOwner ? 'owner' : (member?.role as 'owner' | 'editor' | 'viewer') || 'viewer'}
      userId={user.id}
    />
  );
}

