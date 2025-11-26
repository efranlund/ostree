'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Users } from 'lucide-react';

interface PresenceUser {
  id: string;
  name?: string;
  email?: string;
  last_seen: string;
}

export default function PresenceIndicator({ treeId }: { treeId: string }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`tree-presence-${treeId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Subscribe to presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];

        Object.keys(state).forEach((userId) => {
          const presences = state[userId] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0];
            users.push({
              id: userId,
              name: presence.name || presence.email?.split('@')[0],
              email: presence.email,
              last_seen: new Date().toISOString(),
            });
          }
        });

        setOnlineUsers(users.filter((u) => u.id !== user.id)); // Exclude self
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('name, email')
            .eq('id', user.id)
            .single();

          await channel.track({
            user_id: user.id,
            name: profile?.name || user.email?.split('@')[0],
            email: user.email,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Cleanup
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [treeId, user]);

  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 bg-white rounded-lg shadow-md border border-gray-200 p-3 z-10">
      <div className="flex items-center space-x-2 mb-2">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {onlineUsers.length} viewing
        </span>
      </div>
      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 5).map((u) => (
          <div
            key={u.id}
            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
            title={u.name || u.email}
          >
            {(u.name || u.email || 'U').charAt(0).toUpperCase()}
          </div>
        ))}
        {onlineUsers.length > 5 && (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
            +{onlineUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}

