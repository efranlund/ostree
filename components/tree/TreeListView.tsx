'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Target, Lightbulb, Wrench, FlaskConical, ThumbsUp, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import ICEScoreWidget from './ICEScoreWidget';

interface TreeListViewProps {
  tree: any;
  outcomes: any[];
  opportunities: any[];
  solutions: any[];
  experiments: any[];
  userRole: 'owner' | 'editor' | 'viewer';
  userId: string;
}

interface ExpandedState {
  [key: string]: boolean;
}

export default function TreeListView({
  tree,
  outcomes,
  opportunities,
  solutions,
  experiments,
  userRole,
  userId,
}: TreeListViewProps) {
  const router = useRouter();
  const canEdit = userRole !== 'viewer';
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [editing, setEditing] = useState<{ [key: string]: string }>({});

  // Organize data hierarchically
  const treeData = useMemo(() => {
    const oppsByOutcome: Record<string, any[]> = {};
    const solsByOpp: Record<string, any[]> = {};
    const expsBySol: Record<string, any[]> = {};

    opportunities.forEach((opp) => {
      if (!oppsByOutcome[opp.outcome_id]) {
        oppsByOutcome[opp.outcome_id] = [];
      }
      oppsByOutcome[opp.outcome_id].push(opp);
    });

    solutions.forEach((sol) => {
      if (!solsByOpp[sol.opportunity_id]) {
        solsByOpp[sol.opportunity_id] = [];
      }
      solsByOpp[sol.opportunity_id].push(sol);
    });

    experiments.forEach((exp) => {
      if (!expsBySol[exp.solution_id]) {
        expsBySol[exp.solution_id] = [];
      }
      expsBySol[exp.solution_id].push(exp);
    });

    return outcomes.map((outcome) => ({
      outcome,
      opportunities: (oppsByOutcome[outcome.id] || []).map((opp) => ({
        ...opp,
        solutions: (solsByOpp[opp.id] || []).map((sol) => ({
          ...sol,
          experiments: expsBySol[sol.id] || [],
        })),
      })),
    }));
  }, [outcomes, opportunities, solutions, experiments]);

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (
    table: 'outcomes' | 'opportunities' | 'solutions' | 'experiments',
    id: string,
    field: string,
    value: any
  ) => {
    try {
      await supabase
        .from(table)
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);
      setEditing((prev) => {
        const next = { ...prev };
        delete next[`${table}-${id}-${field}`];
        return next;
      });
      router.refresh();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleEdit = (key: string, value: string) => {
    setEditing((prev) => ({ ...prev, [key]: value }));
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">{tree.name}</h1>
          {tree.description && <p className="text-sm text-gray-600 mt-1">{tree.description}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="space-y-2">
            {treeData.map(({ outcome, opportunities: opps }) => {
              const outcomeKey = `outcome-${outcome.id}`;
              const isOutcomeExpanded = expanded[outcomeKey];

              return (
                <div key={outcome.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Outcome Row */}
                  <div className="bg-blue-50 border-b border-blue-200">
                    <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center text-sm">
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => toggleExpanded(outcomeKey)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {isOutcomeExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="col-span-4">
                        {editing[`outcomes-${outcome.id}-title`] !== undefined ? (
                          <input
                            type="text"
                            value={editing[`outcomes-${outcome.id}-title`]}
                            onChange={(e) => handleEdit(`outcomes-${outcome.id}-title`, e.target.value)}
                            onBlur={() => {
                              const value = editing[`outcomes-${outcome.id}-title`];
                              if (value !== outcome.title) {
                                handleSave('outcomes', outcome.id, 'title', value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-full px-2 py-0.5 text-sm border border-blue-500 rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="font-semibold text-gray-900 cursor-text"
                            onDoubleClick={() => canEdit && handleEdit(`outcomes-${outcome.id}-title`, outcome.title)}
                          >
                            {outcome.title}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 text-xs text-gray-500">-</div>
                      <div className="col-span-4 text-xs text-gray-500">-</div>
                    </div>
                  </div>

                  {/* Opportunities */}
                  {isOutcomeExpanded && (
                    <div className="bg-white">
                      {opps.map((opp) => {
                        const oppKey = `opp-${opp.id}`;
                        const isOppExpanded = expanded[oppKey];

                        return (
                          <div key={opp.id} className="border-t border-gray-100">
                            <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center bg-orange-50/30 text-sm" style={{ paddingLeft: '2rem' }}>
                              <div className="col-span-1 flex justify-center">
                                <button
                                  onClick={() => toggleExpanded(oppKey)}
                                  className="text-orange-600 hover:text-orange-800"
                                >
                                  {isOppExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <div className="col-span-1 flex items-center justify-center">
                                <Lightbulb className="h-4 w-4 text-orange-600" />
                              </div>
                              <div className="col-span-4">
                                {editing[`opportunities-${opp.id}-title`] !== undefined ? (
                                  <input
                                    type="text"
                                    value={editing[`opportunities-${opp.id}-title`]}
                                    onChange={(e) => handleEdit(`opportunities-${opp.id}-title`, e.target.value)}
                                    onBlur={() => {
                                      const value = editing[`opportunities-${opp.id}-title`];
                                      if (value !== opp.title) {
                                        handleSave('opportunities', opp.id, 'title', value);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    className="w-full px-2 py-0.5 text-sm border border-orange-500 rounded"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    className="text-gray-900 cursor-text"
                                    onDoubleClick={() => canEdit && handleEdit(`opportunities-${opp.id}-title`, opp.title)}
                                  >
                                    {opp.title}
                                  </span>
                                )}
                              </div>
                              <div className="col-span-2 flex items-center space-x-2 text-xs">
                                {opp.confidence_level && (
                                  <span className="text-gray-600">
                                    Conf: {opp.confidence_level}/5
                                  </span>
                                )}
                                {opp.voteCount > 0 && (
                                  <span className="flex items-center text-gray-600">
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    {opp.voteCount}
                                  </span>
                                )}
                              </div>
                              <div className="col-span-4 flex items-center space-x-1 text-xs">
                                {canEdit ? (
                                  <>
                                    <input
                                      type="date"
                                      value={opp.start_date || ''}
                                      onChange={(e) => handleSave('opportunities', opp.id, 'start_date', e.target.value || null)}
                                      className="text-xs border border-gray-300 rounded px-1 py-0.5 w-28"
                                      placeholder="Start"
                                    />
                                    <span className="text-gray-400">→</span>
                                    <input
                                      type="date"
                                      value={opp.end_date || ''}
                                      onChange={(e) => handleSave('opportunities', opp.id, 'end_date', e.target.value || null)}
                                      className="text-xs border border-gray-300 rounded px-1 py-0.5 w-28"
                                      placeholder="End"
                                    />
                                  </>
                                ) : (
                                  <span className="text-gray-600">
                                    {opp.start_date || opp.end_date ? (
                                      <>
                                        {formatDate(opp.start_date)} → {formatDate(opp.end_date)}
                                      </>
                                    ) : (
                                      '-'
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Solutions */}
                            {isOppExpanded && (
                              <div>
                                {opp.solutions.map((sol: any) => {
                                  const solKey = `sol-${sol.id}`;
                                  const isSolExpanded = expanded[solKey];

                                  return (
                                    <div key={sol.id} className="border-t border-gray-100">
                                      <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center bg-green-50/30 text-sm" style={{ paddingLeft: '4rem' }}>
                                        <div className="col-span-1 flex justify-center">
                                          <button
                                            onClick={() => toggleExpanded(solKey)}
                                            className="text-green-600 hover:text-green-800"
                                          >
                                            {isSolExpanded ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                          </button>
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center">
                                          <Wrench className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="col-span-4">
                                          {editing[`solutions-${sol.id}-title`] !== undefined ? (
                                            <input
                                              type="text"
                                              value={editing[`solutions-${sol.id}-title`]}
                                              onChange={(e) => handleEdit(`solutions-${sol.id}-title`, e.target.value)}
                                              onBlur={() => {
                                                const value = editing[`solutions-${sol.id}-title`];
                                                if (value !== sol.title) {
                                                  handleSave('solutions', sol.id, 'title', value);
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.currentTarget.blur();
                                                }
                                              }}
                                              className="w-full px-2 py-0.5 text-sm border border-green-500 rounded"
                                              autoFocus
                                            />
                                          ) : (
                                            <span
                                              className="text-gray-900 cursor-text"
                                              onDoubleClick={() => canEdit && handleEdit(`solutions-${sol.id}-title`, sol.title)}
                                            >
                                              {sol.title}
                                            </span>
                                          )}
                                        </div>
                                        <div className="col-span-2 flex items-center space-x-2 text-xs">
                                          <ICEScoreWidget
                                            solutionId={sol.id}
                                            initialImpact={sol.ice_impact}
                                            initialConfidence={sol.ice_confidence}
                                            initialEase={sol.ice_ease}
                                            canEdit={canEdit}
                                            compact={true}
                                          />
                                          {sol.voteCount > 0 && (
                                            <span className="flex items-center text-gray-600">
                                              <ThumbsUp className="h-3 w-3 mr-1" />
                                              {sol.voteCount}
                                            </span>
                                          )}
                                        </div>
                                        <div className="col-span-4 flex items-center space-x-1 text-xs">
                                          {canEdit ? (
                                            <>
                                              <input
                                                type="date"
                                                value={sol.start_date || ''}
                                                onChange={(e) => handleSave('solutions', sol.id, 'start_date', e.target.value || null)}
                                                className="text-xs border border-gray-300 rounded px-1 py-0.5 w-28"
                                                placeholder="Start"
                                              />
                                              <span className="text-gray-400">→</span>
                                              <input
                                                type="date"
                                                value={sol.end_date || ''}
                                                onChange={(e) => handleSave('solutions', sol.id, 'end_date', e.target.value || null)}
                                                className="text-xs border border-gray-300 rounded px-1 py-0.5 w-28"
                                                placeholder="End"
                                              />
                                            </>
                                          ) : (
                                            <span className="text-gray-600">
                                              {sol.start_date || sol.end_date ? (
                                                <>
                                                  {formatDate(sol.start_date)} → {formatDate(sol.end_date)}
                                                </>
                                              ) : (
                                                '-'
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Experiments */}
                                      {isSolExpanded && (
                                        <div>
                                          {sol.experiments.map((exp: any) => (
                                            <div key={exp.id} className="border-t border-gray-100 bg-purple-50/30">
                                              <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center text-sm" style={{ paddingLeft: '6rem' }}>
                                                <div className="col-span-1"></div>
                                                <div className="col-span-1 flex items-center justify-center">
                                                  <FlaskConical className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div className="col-span-4">
                                                  {editing[`experiments-${exp.id}-title`] !== undefined ? (
                                                    <input
                                                      type="text"
                                                      value={editing[`experiments-${exp.id}-title`]}
                                                      onChange={(e) => handleEdit(`experiments-${exp.id}-title`, e.target.value)}
                                                      onBlur={() => {
                                                        const value = editing[`experiments-${exp.id}-title`];
                                                        if (value !== exp.title) {
                                                          handleSave('experiments', exp.id, 'title', value);
                                                        }
                                                      }}
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                          e.currentTarget.blur();
                                                        }
                                                      }}
                                                      className="w-full px-2 py-0.5 text-sm border border-purple-500 rounded"
                                                      autoFocus
                                                    />
                                                  ) : (
                                                    <span
                                                      className="text-gray-900 cursor-text"
                                                      onDoubleClick={() => canEdit && handleEdit(`experiments-${exp.id}-title`, exp.title)}
                                                    >
                                                      {exp.title}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="col-span-2 text-xs">
                                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                    exp.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    exp.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                                    exp.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                  }`}>
                                                    {exp.status}
                                                  </span>
                                                </div>
                                                <div className="col-span-4 text-xs text-gray-600">
                                                  {exp.start_date || exp.end_date ? (
                                                    <span>
                                                      {formatDate(exp.start_date)} → {formatDate(exp.end_date)}
                                                    </span>
                                                  ) : (
                                                    '-'
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

