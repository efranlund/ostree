import { supabase } from '@/lib/supabase/client';
import { debounce } from './debounce';

type TableName = 'outcomes' | 'opportunities' | 'solutions' | 'experiments';

const savePosition = debounce(async (nodeId: string, tableName: TableName, x: number, y: number) => {
  try {
    await supabase
      .from(tableName)
      .update({
        position_x: x,
        position_y: y,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId);
  } catch (error) {
    console.error('Error saving node position:', error);
  }
}, 500);

export async function saveNodePosition(
  nodeId: string,
  nodeType: 'outcome' | 'opportunity' | 'solution' | 'experiment',
  x: number,
  y: number
) {
  const tableMap: Record<string, TableName> = {
    outcome: 'outcomes',
    opportunity: 'opportunities',
    solution: 'solutions',
    experiment: 'experiments',
  };
  
  return savePosition(nodeId, tableMap[nodeType], x, y);
}

export async function createChildNode(
  parentId: string,
  parentType: 'outcome' | 'opportunity' | 'solution',
  userId: string,
  position: { x: number; y: number }
) {
  try {
    if (parentType === 'outcome') {
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          outcome_id: parentId,
          title: 'New Opportunity',
          position_x: position.x,
          position_y: position.y,
          created_by: userId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return { id: data.id, type: 'opportunity' as const, data };
    } else if (parentType === 'opportunity') {
      const { data, error } = await supabase
        .from('solutions')
        .insert({
          opportunity_id: parentId,
          title: 'New Solution',
          position_x: position.x,
          position_y: position.y,
          created_by: userId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return { id: data.id, type: 'solution' as const, data };
    } else if (parentType === 'solution') {
      // When clicking "+" on a solution, create a sub-solution (not an experiment)
      // Users can still create experiments through other means if needed
      const { data, error } = await supabase
        .from('solutions')
        .insert({
          parent_solution_id: parentId,
          title: 'New Sub-Solution',
          position_x: position.x,
          position_y: position.y,
          created_by: userId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return { id: data.id, type: 'solution' as const, data };
    }
  } catch (error) {
    console.error('Error creating child node:', error);
    throw error;
  }
}

export async function createExperiment(
  solutionId: string,
  userId: string,
  position: { x: number; y: number }
) {
  try {
    const { data, error } = await supabase
      .from('experiments')
      .insert({
        solution_id: solutionId,
        title: 'New Experiment',
        position_x: position.x,
        position_y: position.y,
        status: 'planned',
        created_by: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return { id: data.id, type: 'experiment' as const, data };
  } catch (error) {
    console.error('Error creating experiment:', error);
    throw error;
  }
}

export async function createOutcome(
  treeId: string,
  userId: string,
  position: { x: number; y: number }
) {
  try {
    const { data, error } = await supabase
      .from('outcomes')
      .insert({
        tree_id: treeId,
        title: 'New Outcome',
        description: 'Describe the desired outcome',
        position_x: position.x,
        position_y: position.y,
        created_by: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return { id: data.id, type: 'outcome' as const, data };
  } catch (error) {
    console.error('Error creating outcome:', error);
    throw error;
  }
}

export async function deleteNode(
  nodeId: string,
  nodeType: 'outcome' | 'opportunity' | 'solution' | 'experiment'
) {
  const tableMap: Record<string, TableName> = {
    outcome: 'outcomes',
    opportunity: 'opportunities',
    solution: 'solutions',
    experiment: 'experiments',
  };

  try {
    const { error } = await supabase
      .from(tableMap[nodeType])
      .delete()
      .eq('id', nodeId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting node:', error);
    throw error;
  }
}

