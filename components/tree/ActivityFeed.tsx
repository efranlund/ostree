'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Activity, User } from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  user_id: string;
  created_at: string;
  node_id?: string;
  node_type?: string;
  metadata?: any;
  user_profiles?: {
    name?: string;
    email?: string;
  };
}

export default function ActivityFeed({ treeId }: { treeId: string }) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [treeId]);

  const loadActivities = async () => {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        user_profiles!inner(name, email)
      `)
      .eq('tree_id', treeId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setActivities(data as any);
    }
  };

  const getActionLabel = (action: string, metadata: any) => {
    const actionMap: Record<string, string> = {
      tree_created: 'created the tree',
      tree_updated: 'updated the tree',
      outcomes_created: 'created an outcome',
      outcomes_updated: 'updated an outcome',
      opportunities_created: 'created an opportunity',
      opportunities_updated: 'updated an opportunity',
      solutions_created: 'created a solution',
      solutions_updated: 'updated a solution',
      experiments_created: 'created an experiment',
      experiments_updated: 'updated an experiment',
    };

    const baseLabel = actionMap[action] || action;
    if (metadata?.title) {
      return `${baseLabel}: "${metadata.title}"`;
    }
    return baseLabel;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 flex items-center space-x-2 z-10"
      >
        <Activity className="h-5 w-5" />
        {activities.length > 0 && (
          <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold">
            {activities.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-10 max-h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Activity</span>
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-4">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No activity yet
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">
                          {activity.user_profiles?.name ||
                            activity.user_profiles?.email ||
                            'Someone'}
                        </span>{' '}
                        {getActionLabel(activity.action, activity.metadata)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

