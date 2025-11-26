'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useReactFlow, useViewport } from 'reactflow';

interface Cursor {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
}

interface CursorPresenceProps {
  treeId: string;
}

// Generate a consistent color for a user based on their ID
const getUserColor = (userId: string): string => {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#84cc16', // lime
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#d946ef', // fuchsia
    '#ec4899', // pink
  ];
  
  // Generate a hash from the userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Get a consistent ice hockey icon for a user
const getHockeyIcon = (userId: string) => {
  const icons = ['puck', 'stick', 'skate', 'goal', 'whistle', 'helmet', 'glove'];
  
  // Generate a hash from the userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return icons[Math.abs(hash) % icons.length];
};

// Render ice hockey icon SVG
const HockeyIcon = ({ type, color }: { type: string; color: string }) => {
  const iconStyle = {
    filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 6px ${color}40)`,
  };

  switch (type) {
    case 'puck':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <ellipse cx="12" cy="12" rx="8" ry="4" fill={color} stroke="white" strokeWidth="1.5" />
          <path d="M4 12 Q4 9 12 9 Q20 9 20 12" fill={color} opacity="0.7" />
        </svg>
      );
    
    case 'stick':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M4 20 L14 4 M14 4 L18 6 L20 10 L16 12 L14 4Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="white" />
          <path d="M14 4 L18 6 L20 10 L16 12 Z" fill={color} stroke="white" strokeWidth="1" />
        </svg>
      );
    
    case 'skate':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M6 10 Q8 8 12 8 L14 12 L4 14 Z" fill={color} stroke="white" strokeWidth="1.5" />
          <line x1="4" y1="14" x2="16" y2="14" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <line x1="5" y1="17" x2="15" y2="17" stroke="white" strokeWidth="1.5" />
        </svg>
      );
    
    case 'goal':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <rect x="5" y="8" width="14" height="10" fill="none" stroke={color} strokeWidth="2" />
          <path d="M5 8 L12 18 L19 8" stroke={color} strokeWidth="1.5" opacity="0.5" />
          <path d="M8 8 L8 18 M12 8 L12 18 M16 8 L16 18" stroke={color} strokeWidth="1" opacity="0.5" />
          <circle cx="12" cy="13" r="2" fill="white" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    
    case 'whistle':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <circle cx="12" cy="12" r="5" fill={color} stroke="white" strokeWidth="1.5" />
          <circle cx="12" cy="10" r="1.5" fill="white" />
          <path d="M12 12 L12 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="17" x2="12" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    
    case 'helmet':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M6 14 Q6 6 12 6 Q18 6 18 14 L18 16 L6 16 Z" fill={color} stroke="white" strokeWidth="1.5" />
          <rect x="6" y="14" width="12" height="2" fill={color} stroke="white" strokeWidth="1" />
          <line x1="9" y1="16" x2="9" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="16" x2="15" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    
    case 'glove':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M8 8 L8 16 Q8 18 10 18 L14 18 Q16 18 16 16 L16 12" fill={color} stroke="white" strokeWidth="1.5" />
          <path d="M10 8 L10 12 M12 7 L12 11 M14 8 L14 12 M16 9 L16 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="15" r="1.5" fill="white" />
        </svg>
      );
    
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <ellipse cx="12" cy="12" rx="8" ry="4" fill={color} stroke="white" strokeWidth="1.5" />
        </svg>
      );
  }
};

export default function CursorPresence({ treeId }: CursorPresenceProps) {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const reactFlowInstance = useReactFlow();
  const viewport = useViewport(); // Trigger re-render on viewport changes

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`cursor-presence-${treeId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Subscribe to cursor movements
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newCursors: Record<string, Cursor> = {};

        Object.keys(state).forEach((userId) => {
          if (userId === user.id) return; // Skip own cursor

          const presences = state[userId] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0];
            if (presence.x !== undefined && presence.y !== undefined) {
              newCursors[userId] = {
                id: userId,
                x: presence.x,
                y: presence.y,
                name: presence.name || presence.email?.split('@')[0] || 'User',
                color: getUserColor(userId),
              };
            }
          }
        });

        setCursors(newCursors);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Get user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('name, email')
            .eq('id', user.id)
            .single();

          // Track initial cursor position (off-screen initially)
          await channel.track({
            user_id: user.id,
            name: profile?.name || user.email?.split('@')[0],
            email: user.email,
            x: -100,
            y: -100,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Track mouse movements on the ReactFlow canvas
    let lastUpdate = 0;
    const handleMouseMove = (event: MouseEvent) => {
      if (!reactFlowInstance) return;

      // Convert screen coordinates to flow coordinates
      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Throttle updates to every 30ms for optimal balance of smoothness and performance
      const now = Date.now();
      if (!lastUpdate || now - lastUpdate > 30) {
        lastUpdate = now;

        channel.track({
          user_id: user.id,
          name: user.email?.split('@')[0],
          email: user.email,
          x: flowPosition.x,
          y: flowPosition.y,
          online_at: new Date().toISOString(),
        });
      }
    };

    // Attach to document to capture all movements
    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [treeId, user, reactFlowInstance]);

  // Render cursors in ReactFlow coordinate space
  return (
    <>
      {Object.values(cursors).map((cursor) => {
        // Convert flow coordinates to screen coordinates
        const screenPos = reactFlowInstance?.flowToScreenPosition({
          x: cursor.x,
          y: cursor.y,
        }) || { x: -100, y: -100 };

        const iconType = getHockeyIcon(cursor.id);

        return (
          <div
            key={cursor.id}
            className="pointer-events-none fixed z-50 animate-cursor-appear"
            style={{
              left: screenPos.x,
              top: screenPos.y,
              transition: 'left 0.12s cubic-bezier(0.25, 0.1, 0.25, 1), top 0.12s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            {/* Ice hockey icon */}
            <div className="relative">
              <HockeyIcon type={iconType} color={cursor.color} />
            </div>
            
            {/* User name label with slide-in animation */}
            <div
              className="absolute left-7 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg animate-label-slide"
              style={{ 
                backgroundColor: cursor.color,
                transition: 'opacity 0.2s ease',
              }}
            >
              {cursor.name}
            </div>
          </div>
        );
      })}
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes cursor-appear {
          from {
            opacity: 0;
            transform: translate(-2px, -2px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-2px, -2px) scale(1);
          }
        }
        
        @keyframes label-slide {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-cursor-appear {
          animation: cursor-appear 0.2s ease-out;
        }
        
        .animate-label-slide {
          animation: label-slide 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

