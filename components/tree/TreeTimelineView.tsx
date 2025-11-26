'use client';

import { useMemo, useState } from 'react';
import { Target, Lightbulb, Wrench, FlaskConical, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface TreeTimelineViewProps {
  tree: any;
  outcomes: any[];
  opportunities: any[];
  solutions: any[];
  experiments: any[];
  userRole: 'owner' | 'editor' | 'viewer';
  userId: string;
}

interface TimelineItem {
  id: string;
  type: 'opportunity' | 'solution' | 'experiment';
  title: string;
  date: string | null;
  endDate?: string | null;
  outcomeId?: string;
  opportunityId?: string;
  solutionId?: string;
  status?: string;
  color: string;
}

export default function TreeTimelineView({
  tree,
  outcomes,
  opportunities,
  solutions,
  experiments,
  userRole,
  userId,
}: TreeTimelineViewProps) {
  const router = useRouter();
  const canEdit = userRole !== 'viewer';
  const [groupBy, setGroupBy] = useState<'outcome' | 'opportunity'>('outcome');

  // Build timeline items
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add opportunities
    opportunities.forEach((opp) => {
      if (opp.start_date || opp.end_date) {
        items.push({
          id: opp.id,
          type: 'opportunity',
          title: opp.title,
          date: opp.start_date || opp.end_date,
          endDate: opp.end_date || null,
          outcomeId: opp.outcome_id,
          color: '#f97316',
        });
      }
    });

    // Add solutions
    solutions.forEach((sol) => {
      if (sol.start_date || sol.end_date) {
        items.push({
          id: sol.id,
          type: 'solution',
          title: sol.title,
          date: sol.start_date || sol.end_date,
          endDate: sol.end_date || null,
          opportunityId: sol.opportunity_id,
          color: '#10b981',
        });
      }
    });

    // Add experiments
    experiments.forEach((exp) => {
      if (exp.start_date || exp.end_date) {
        items.push({
          id: exp.id,
          type: 'experiment',
          title: exp.title,
          date: exp.start_date || exp.end_date || null,
          endDate: exp.end_date || null,
          solutionId: exp.solution_id,
          status: exp.status,
          color: '#8b5cf6',
        });
      }
    });

    return items.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [opportunities, solutions, experiments]);

  // Group items
  const groupedItems = useMemo(() => {
    if (groupBy === 'outcome') {
      const groups: Record<string, { outcome: any; items: TimelineItem[] }> = {};
      
      outcomes.forEach((outcome) => {
        groups[outcome.id] = { outcome, items: [] };
      });

      timelineItems.forEach((item) => {
        if (item.outcomeId) {
          if (groups[item.outcomeId]) {
            groups[item.outcomeId].items.push(item);
          }
        } else if (item.opportunityId) {
          const opp = opportunities.find((o) => o.id === item.opportunityId);
          if (opp && groups[opp.outcome_id]) {
            groups[opp.outcome_id].items.push(item);
          }
        } else if (item.solutionId) {
          const sol = solutions.find((s) => s.id === item.solutionId);
          if (sol) {
            const opp = opportunities.find((o) => o.id === sol.opportunity_id);
            if (opp && groups[opp.outcome_id]) {
              groups[opp.outcome_id].items.push(item);
            }
          }
        }
      });

      return Object.values(groups);
    } else {
      const groups: Record<string, { opportunity: any; items: TimelineItem[] }> = {};
      
      opportunities.forEach((opp) => {
        groups[opp.id] = { opportunity: opp, items: [] };
      });

      timelineItems.forEach((item) => {
        if (item.opportunityId) {
          if (groups[item.opportunityId]) {
            groups[item.opportunityId].items.push(item);
          }
        } else if (item.solutionId) {
          const sol = solutions.find((s) => s.id === item.solutionId);
          if (sol && groups[sol.opportunity_id]) {
            groups[sol.opportunity_id].items.push(item);
          }
        }
      });

      return Object.values(groups);
    }
  }, [timelineItems, groupBy, outcomes, opportunities, solutions]);

  // Calculate date range
  const dateRange = useMemo(() => {
    const dates = timelineItems
      .map((item) => [item.date, item.endDate])
      .flat()
      .filter((d): d is string => d !== null)
      .map((d) => new Date(d).getTime());

    if (dates.length === 0) {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 6, 0);
      return { start, end };
    }

    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    
    // Add padding
    const padding = (max.getTime() - min.getTime()) * 0.1;
    return {
      start: new Date(min.getTime() - padding),
      end: new Date(max.getTime() + padding),
    };
  }, [timelineItems]);

  const getDatePosition = (date: string | null) => {
    if (!date) return 0;
    const dateTime = new Date(date).getTime();
    const range = dateRange.end.getTime() - dateRange.start.getTime();
    const position = ((dateTime - dateRange.start.getTime()) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateChange = async (
    table: 'outcomes' | 'opportunities' | 'solutions' | 'experiments',
    id: string,
    field: string,
    value: string | null
  ) => {
    try {
      await supabase
        .from(table)
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);
      router.refresh();
    } catch (error) {
      console.error('Error updating date:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Lightbulb className="h-4 w-4" />;
      case 'solution':
        return <Wrench className="h-4 w-4" />;
      case 'experiment':
        return <FlaskConical className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tree.name}</h1>
              {tree.description && <p className="text-sm text-gray-600 mt-1">{tree.description}</p>}
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <span className="text-gray-700">Group by:</span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as 'outcome' | 'opportunity')}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value="outcome">Outcome</option>
                  <option value="opportunity">Opportunity</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
        {timelineItems.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No items with dates to display on the timeline.</p>
            <p className="text-sm text-gray-500 mt-2">Add target dates to opportunities and solutions, or dates to experiments.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedItems.map((group) => {
              if (group.items.length === 0) return null;

              const groupTitle = groupBy === 'outcome' 
                ? ('outcome' in group ? group.outcome.title : '')
                : ('opportunity' in group ? group.opportunity.title : '');
              const groupIcon = groupBy === 'outcome' 
                ? <Target className="h-5 w-5 text-blue-600" />
                : <Lightbulb className="h-5 w-5 text-orange-600" />;

              return (
                <div key={groupBy === 'outcome' ? ('outcome' in group ? group.outcome.id : '') : ('opportunity' in group ? group.opportunity.id : '')} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    {groupIcon}
                    <h3 className="font-semibold text-gray-900">{groupTitle}</h3>
                  </div>
                  <div className="relative">
                    {/* Timeline track */}
                    <div className="h-2 bg-gray-200 rounded-full mb-8 relative">
                      {group.items.map((item) => {
                        const startPos = getDatePosition(item.date);
                        const endPos = item.endDate ? getDatePosition(item.endDate) : startPos;
                        const width = Math.abs(endPos - startPos) || 2;

                        return (
                          <div
                            key={item.id}
                            className="absolute top-0 h-2 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              left: `${Math.min(startPos, endPos)}%`,
                              width: `${width}%`,
                              backgroundColor: item.color,
                            }}
                            title={`${item.title} - ${formatDate(item.date)}${item.endDate ? ` to ${formatDate(item.endDate)}` : ''}`}
                          />
                        );
                      })}
                    </div>

                    {/* Items */}
                    <div className="space-y-4">
                      {group.items.map((item) => {
                        const position = getDatePosition(item.date);

                        return (
                          <div
                            key={item.id}
                            className="relative"
                            style={{ paddingLeft: `${position}%` }}
                          >
                            <div
                              className="flex items-center space-x-2 p-2 rounded border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow"
                              style={{ borderLeftColor: item.color }}
                            >
                              <div style={{ color: item.color }}>{getIcon(item.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900 truncate">{item.title}</div>
                                <div className="text-xs text-gray-500">
                                  {item.type === 'experiment' && item.status && (
                                    <span className={`px-2 py-0.5 rounded mr-2 ${
                                      item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      item.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                      item.status === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {item.status}
                                    </span>
                                  )}
                                  {formatDate(item.date)}
                                  {item.endDate && ` - ${formatDate(item.endDate)}`}
                                </div>
                              </div>
                              {canEdit && (
                                <div className="flex items-center space-x-2">
                                  {item.type === 'opportunity' && (
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="date"
                                        value={item.date || ''}
                                        onChange={(e) => handleDateChange('opportunities', item.id, 'start_date', e.target.value || null)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                        placeholder="Start"
                                      />
                                      <span className="text-gray-400">-</span>
                                      <input
                                        type="date"
                                        value={item.endDate || ''}
                                        onChange={(e) => handleDateChange('opportunities', item.id, 'end_date', e.target.value || null)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                        placeholder="End"
                                      />
                                    </div>
                                  )}
                                  {item.type === 'solution' && (
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="date"
                                        value={item.date || ''}
                                        onChange={(e) => handleDateChange('solutions', item.id, 'start_date', e.target.value || null)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                        placeholder="Start"
                                      />
                                      <span className="text-gray-400">-</span>
                                      <input
                                        type="date"
                                        value={item.endDate || ''}
                                        onChange={(e) => handleDateChange('solutions', item.id, 'end_date', e.target.value || null)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                        placeholder="End"
                                      />
                                    </div>
                                  )}
                                  {item.type === 'experiment' && (
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="date"
                                        value={item.date || ''}
                                        onChange={(e) => handleDateChange('experiments', item.id, 'start_date', e.target.value || null)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                        placeholder="Start"
                                      />
                                      <span className="text-gray-400">-</span>
                                      <input
                                        type="date"
                                        value={item.endDate || ''}
                                        onChange={(e) => handleDateChange('experiments', item.id, 'end_date', e.target.value || null)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                        placeholder="End"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

