'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Edit2, Plus, ChevronRight, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import LinearLink from '@/components/LinearLink';
import { createChildNode } from '@/lib/utils/nodeOperations';

interface NodeDetailsPageProps {
  treeId: string;
  nodeId: string;
  nodeType: 'opportunity' | 'solution' | 'experiment';
  initialData: any;
  subSolutions?: any[];
  parentSolution?: any;
  parentBreadcrumb?: any[];
  userRole: 'owner' | 'editor' | 'viewer';
  userId: string;
}

export default function NodeDetailsPage({
  treeId,
  nodeId,
  nodeType,
  initialData,
  subSolutions = [],
  parentSolution,
  parentBreadcrumb = [],
  userRole,
  userId,
}: NodeDetailsPageProps) {
  const router = useRouter();
  const canEdit = userRole !== 'viewer';

  // State for all fields
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [details, setDetails] = useState(initialData.details || '');
  const [linearUrl, setLinearUrl] = useState(initialData.linear_ticket_url || null);

  // Type-specific fields
  const [problemStatement, setProblemStatement] = useState(initialData.problem_statement || '');
  const [desiredOutcome, setDesiredOutcome] = useState(initialData.desired_outcome || '');
  const [assumptions, setAssumptions] = useState(initialData.assumptions || '');
  const [risks, setRisks] = useState(initialData.risks || '');
  const [constraints, setConstraints] = useState(initialData.constraints || '');
  const [hypothesis, setHypothesis] = useState(initialData.hypothesis || '');
  const [failCondition, setFailCondition] = useState(initialData.fail_condition || '');

  // Editing states
  const [editingField, setEditingField] = useState<string | null>(null);

  const tableName = nodeType === 'opportunity' ? 'opportunities' : nodeType === 'solution' ? 'solutions' : 'experiments';

  const handleSave = useCallback(async (field: string, value: string) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ 
          [field]: value || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', nodeId);

      if (error) throw error;
      setEditingField(null);
      router.refresh();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    }
  }, [tableName, nodeId, router]);

  const getNodeTypeLabel = () => {
    return nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
  };

  const getNodeTypeColor = () => {
    if (nodeType === 'opportunity') return 'orange';
    if (nodeType === 'solution') return 'green';
    return 'purple';
  };

  const renderEditableField = (
    fieldName: string,
    label: string,
    value: string,
    setValue: (val: string) => void,
    placeholder: string,
    isTextarea: boolean = false
  ) => {
    const isEditing = editingField === fieldName;

    return (
      <div className="group">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {canEdit && !isEditing && (
            <button
              onClick={() => setEditingField(fieldName)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {isEditing && canEdit ? (
          <div>
            {isTextarea ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder}
                rows={4}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder}
                autoFocus
              />
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleSave(fieldName, value)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setValue(initialData[fieldName] || '');
                  setEditingField(null);
                }}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div 
            className={`px-3 py-2 bg-gray-50 rounded-md border border-gray-200 min-h-[40px] ${canEdit ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            onClick={() => canEdit && setEditingField(fieldName)}
          >
            {value ? (
              <p className="text-gray-900 whitespace-pre-wrap">{value}</p>
            ) : (
              <p className="text-gray-400 italic">{placeholder}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                getNodeTypeColor() === 'orange' ? 'bg-orange-500' :
                getNodeTypeColor() === 'green' ? 'bg-green-500' :
                'bg-purple-500'
              }`}>
                {getNodeTypeLabel()}
              </span>
              <h1 className="text-xl font-bold text-gray-900">{title || 'Untitled'}</h1>
            </div>
          </div>
          {/* Parent breadcrumb for sub-solutions */}
          {nodeType === 'solution' && parentBreadcrumb.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 ml-14">
              {parentBreadcrumb.map((parent, index) => (
                <div key={parent.id} className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/trees/${treeId}/solution/${parent.id}`)}
                    className="hover:text-blue-600 hover:underline"
                  >
                    {parent.title}
                  </button>
                  {index < parentBreadcrumb.length - 1 && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {renderEditableField('title', 'Title', title, setTitle, 'Enter title...', false)}
                {renderEditableField('description', 'Description', description, setDescription, 'Enter description...', true)}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Linear Issue
                  </label>
                  <LinearLink
                    nodeId={nodeId}
                    nodeType={nodeType}
                    initialUrl={linearUrl}
                    canEdit={canEdit}
                    onUpdate={setLinearUrl}
                  />
                </div>

                {renderEditableField('details', 'Additional Notes', details, setDetails, 'Add any additional notes...', true)}
              </div>

              {/* Right Column - Type-specific fields */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  {nodeType === 'opportunity' && 'Opportunity Details'}
                  {nodeType === 'solution' && 'Solution Details'}
                  {nodeType === 'experiment' && 'Experiment Details'}
                </h3>

                {nodeType === 'opportunity' && (
                  <>
                    {renderEditableField('problem_statement', 'Problem Statement', problemStatement, setProblemStatement, 'What is the problem we\'re trying to solve?', true)}
                    {renderEditableField('desired_outcome', 'Desired Outcome', desiredOutcome, setDesiredOutcome, 'What is the desired outcome if we solve this?', true)}
                  </>
                )}

                {nodeType === 'solution' && (
                  <>
                    {renderEditableField('assumptions', 'Assumptions', assumptions, setAssumptions, 'What assumptions are we making?', true)}
                    {renderEditableField('risks', 'Risks', risks, setRisks, 'What are the risks?', true)}
                    {renderEditableField('constraints', 'Constraints', constraints, setConstraints, 'What constraints do we need to consider?', true)}
                    
                    {/* Sub-Solutions Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Sub-Solutions ({subSolutions.length})
                        </h3>
                        {canEdit && (
                          <button
                            onClick={async () => {
                              try {
                                await createChildNode(nodeId, 'solution', userId, { x: 0, y: 0 });
                                router.refresh();
                              } catch (error) {
                                console.error('Error creating sub-solution:', error);
                                alert('Failed to create sub-solution');
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Sub-Solution
                          </button>
                        )}
                      </div>
                      {subSolutions.length > 0 ? (
                        <div className="space-y-2">
                          {subSolutions.map((subSol) => (
                            <div
                              key={subSol.id}
                              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                              onClick={() => router.push(`/trees/${treeId}/solution/${subSol.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <Wrench className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-gray-900">{subSol.title}</span>
                                {subSol.description && (
                                  <span className="text-sm text-gray-600 truncate max-w-md">
                                    {subSol.description}
                                  </span>
                                )}
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No sub-solutions yet. Click "Add Sub-Solution" to break this solution down into smaller tasks.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {nodeType === 'experiment' && (
                  <>
                    {renderEditableField('hypothesis', 'Hypothesis', hypothesis, setHypothesis, 'If we do X, then Y will happen...', true)}
                    {renderEditableField('fail_condition', 'Fail Condition', failCondition, setFailCondition, 'We will fail if...', true)}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
