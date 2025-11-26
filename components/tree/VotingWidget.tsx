'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { ThumbsUp } from 'lucide-react';

interface VotingWidgetProps {
  nodeId: string;
  nodeType: 'outcome' | 'opportunity' | 'solution' | 'experiment';
  initialVote?: number;
  initialVoteCount?: number;
}

export default function VotingWidget({
  nodeId,
  nodeType,
  initialVote,
  initialVoteCount = 0,
}: VotingWidgetProps) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<number | null>(initialVote || null);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadVotes();

    // Subscribe to vote changes
    const subscription = supabase
      .channel(`votes-${nodeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `node_id=eq.${nodeId}`,
        },
        () => {
          loadVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [nodeId]);

  const loadVotes = async () => {
    if (!user) return;

    // Get user's vote
    const { data: userVoteData } = await supabase
      .from('votes')
      .select('value')
      .eq('node_id', nodeId)
      .eq('node_type', nodeType)
      .eq('user_id', user.id)
      .maybeSingle();

    if (userVoteData) {
      setUserVote(userVoteData.value);
    }

    // Get total vote count and average
    const { data: allVotes } = await supabase
      .from('votes')
      .select('value')
      .eq('node_id', nodeId)
      .eq('node_type', nodeType);

    if (allVotes) {
      setVoteCount(allVotes.length);
    }
  };

  const handleVote = async (value: number) => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      if (userVote === value) {
        // Remove vote if clicking same value
        await supabase
          .from('votes')
          .delete()
          .eq('node_id', nodeId)
          .eq('node_type', nodeType)
          .eq('user_id', user.id);

        setUserVote(null);
        setVoteCount((prev) => Math.max(0, prev - 1));
      } else {
        // Upsert vote
        await supabase.from('votes').upsert(
          {
            node_id: nodeId,
            node_type: nodeType,
            user_id: user.id,
            value: value,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'node_id,node_type,user_id',
          }
        );

        setUserVote(value);
        if (userVote === null) {
          setVoteCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-1 mt-2">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          onClick={() => handleVote(value)}
          disabled={isLoading}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-colors ${
            userVote && userVote >= value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={`Vote ${value} out of 5`}
        >
          {value}
        </button>
      ))}
      {voteCount > 0 && (
        <span className="ml-2 text-xs text-gray-500 flex items-center">
          <ThumbsUp className="h-3 w-3 mr-1" />
          {voteCount}
        </span>
      )}
    </div>
  );
}

