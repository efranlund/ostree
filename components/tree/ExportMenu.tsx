'use client';

import { useState } from 'react';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ExportMenuProps {
  tree: {
    id: string;
    name: string;
    is_public: boolean;
  };
  userRole: 'owner' | 'editor' | 'viewer';
  onExportJSON?: () => void;
}

export default function ExportMenu({ tree, userRole, onExportJSON }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const canEdit = userRole === 'owner' || userRole === 'editor';

  const exportAsPNG = async () => {
    setIsExporting(true);
    try {
      // Get the ReactFlow viewport element
      const reactFlowWrapper = document.querySelector('.react-flow');
      if (!reactFlowWrapper) {
        alert('Unable to find React Flow element. Please try again.');
        return;
      }

      // For now, we'll use a simple alert
      // In production, you might want to use html2canvas or similar library
      alert('PNG export feature coming soon! For now, you can use your browser\'s screenshot tool or the Export as JSON option.');
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJSON = async () => {
    if (onExportJSON) {
      onExportJSON();
    }
  };

  const togglePublicSharing = async () => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from('trees')
        .update({ is_public: !tree.is_public })
        .eq('id', tree.id);

      if (error) throw error;

      window.location.reload();
    } catch (error) {
      console.error('Error toggling public sharing:', error);
      alert('Failed to update sharing settings. Please try again.');
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/trees/${tree.id}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
      >
        <Share2 className="h-4 w-4" />
        <span>Export & Share</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2">
              <button
                onClick={exportAsPNG}
                disabled={isExporting}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Download className="h-4 w-4" />
                <span>Export as PNG</span>
              </button>
              <button
                onClick={exportAsJSON}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Download className="h-4 w-4" />
                <span>Export as JSON</span>
              </button>
              {canEdit && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={togglePublicSharing}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <span>Public sharing</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      tree.is_public
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tree.is_public ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  {tree.is_public && (
                    <button
                      onClick={copyPublicLink}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Link copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy public link</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

