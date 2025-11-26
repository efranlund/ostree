import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TreesList from '@/components/trees/TreesList';
import CreateTreeButton from '@/components/trees/CreateTreeButton';

export default async function TreesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch trees the user has access to
  // Note: RLS policies will further filter based on access rights
  const { data: allTrees, error: treesError } = await supabase
    .from('trees')
    .select(`
      *,
      outcomes(count)
    `)
    .order('updated_at', { ascending: false });

  // Fetch user's memberships
  const { data: memberships } = await supabase
    .from('tree_members')
    .select('tree_id, role')
    .eq('user_id', user.id);

  const memberTreeIds = new Set(memberships?.map(m => m.tree_id) || []);

  // Filter trees the user can access
  const trees = allTrees?.filter(tree => 
    tree.created_by === user.id || 
    memberTreeIds.has(tree.id) || 
    tree.is_public
  );

  const error = treesError;

  if (error) {
    console.error('Error fetching trees:', error);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Opportunity Solution Trees</h1>
          <p className="mt-2 text-gray-600">
            Create and manage your product discovery trees
          </p>
        </div>
        <CreateTreeButton />
      </div>
      <TreesList trees={trees || []} />
    </div>
  );
}

