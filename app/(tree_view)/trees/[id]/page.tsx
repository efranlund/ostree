import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TreeEditorWrapper from '@/components/tree/TreeEditorWrapper';

export default async function TreePage({
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

  // Fetch all tree data
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

  const { data: solutions } = opportunityIds.length > 0
    ? await supabase
        .from('solutions')
        .select('*')
        .in('opportunity_id', opportunityIds)
        .order('created_at', { ascending: true })
    : { data: [] };

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
  })) || [];

  const { data: experiments } = solutionIds.length > 0
    ? await supabase
        .from('experiments')
        .select('*')
        .in('solution_id', solutionIds)
        .order('created_at', { ascending: true })
    : { data: [] };

  return (
    <TreeEditorWrapper
      tree={tree}
      outcomes={outcomes || []}
      opportunities={opportunitiesWithVotes}
      solutions={solutionsWithVotes}
      experiments={experiments || []}
      userRole={isOwner ? 'owner' : member?.role || 'viewer'}
      userId={user.id}
    />
  );
}
