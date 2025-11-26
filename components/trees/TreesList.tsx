'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { TreePine, Users, Calendar } from 'lucide-react';

interface Tree {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string;
  outcomes?: { count: number }[];
}

export default function TreesList({ trees }: { trees: Tree[] }) {
  if (trees.length === 0) {
    return (
      <div className="text-center py-12">
        <TreePine className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No trees</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new opportunity solution tree.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trees.map((tree) => (
        <Link
          key={tree.id}
          href={`/trees/${tree.id}`}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {tree.name}
              </h3>
              {tree.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {tree.description}
                </p>
              )}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {tree.updated_at && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(tree.updated_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
                {tree.outcomes && tree.outcomes[0]?.count > 0 && (
                  <div className="flex items-center space-x-1">
                    <TreePine className="h-4 w-4" />
                    <span>{tree.outcomes[0].count} outcome(s)</span>
                  </div>
                )}
                {tree.is_public && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>Public</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

