'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ICEScoreWidgetProps {
  solutionId: string;
  initialImpact?: number | null;
  initialConfidence?: number | null;
  initialEase?: number | null;
  canEdit?: boolean;
  compact?: boolean;
}

export default function ICEScoreWidget({
  solutionId,
  initialImpact,
  initialConfidence,
  initialEase,
  canEdit = true,
  compact = false,
}: ICEScoreWidgetProps) {
  const router = useRouter();
  const [impact, setImpact] = useState(initialImpact || null);
  const [confidence, setConfidence] = useState(initialConfidence || null);
  const [ease, setEase] = useState(initialEase || null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setImpact(initialImpact || null);
    setConfidence(initialConfidence || null);
    setEase(initialEase || null);
  }, [initialImpact, initialConfidence, initialEase]);

  const calculateScore = () => {
    if (impact && confidence && ease) {
      return impact * confidence * ease;
    }
    return null;
  };

  const handleSave = async () => {
    try {
      await supabase
        .from('solutions')
        .update({
          ice_impact: impact,
          ice_confidence: confidence,
          ice_ease: ease,
          updated_at: new Date().toISOString(),
        })
        .eq('id', solutionId);
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving ICE scores:', error);
    }
  };

  const score = calculateScore();

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {score !== null ? (
          <span className="flex items-center text-xs font-semibold text-green-700">
            <TrendingUp className="h-3 w-3 mr-1" />
            ICE: {score}
          </span>
        ) : (
          canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Add ICE Score
            </button>
          )
        )}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsEditing(false)}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">ICE Score</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Impact (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={impact || ''}
                    onChange={(e) => setImpact(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={confidence || ''}
                    onChange={(e) => setConfidence(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ease (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={ease || ''}
                    onChange={(e) => setEase(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                {score !== null && (
                  <div className="p-3 bg-green-50 rounded-md">
                    <div className="text-sm font-medium text-gray-700">ICE Score</div>
                    <div className="text-2xl font-bold text-green-700">{score}</div>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setImpact(initialImpact || null);
                      setConfidence(initialConfidence || null);
                      setEase(initialEase || null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">ICE Score</span>
        {canEdit && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>
      {isEditing && canEdit ? (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Impact (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={impact || ''}
              onChange={(e) => setImpact(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Confidence (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={confidence || ''}
              onChange={(e) => setConfidence(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ease (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={ease || ''}
              onChange={(e) => setEase(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          {score !== null && (
            <div className="p-2 bg-green-100 rounded text-center">
              <div className="text-xs text-gray-600">ICE Score</div>
              <div className="text-lg font-bold text-green-700">{score}</div>
            </div>
          )}
          <button
            onClick={handleSave}
            className="w-full px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
          >
            Save
          </button>
        </div>
      ) : (
        <div>
          {score !== null ? (
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-700">{score}</span>
              <span className="text-xs text-gray-500">
                (I:{impact} × C:{confidence} × E:{ease})
              </span>
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-1">
              No ICE score set
            </div>
          )}
        </div>
      )}
    </div>
  );
}

