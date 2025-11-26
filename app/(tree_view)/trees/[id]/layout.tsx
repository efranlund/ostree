'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Network, List, Calendar } from 'lucide-react';

export default function TreeDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Extract tree ID from path (e.g., /trees/[id] or /trees/[id]/list)
  const pathParts = pathname.split('/').filter(Boolean);
  const treeId = pathParts[1] || '';

  const tabs = [
    {
      name: 'Tree',
      href: `/trees/${treeId}`,
      icon: Network,
    },
    {
      name: 'List',
      href: `/trees/${treeId}/list`,
      icon: List,
    },
    {
      name: 'Timeline',
      href: `/trees/${treeId}/timeline`,
      icon: Calendar,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 bg-white">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || 
                (tab.href === `/trees/${treeId}` && pathname === `/trees/${treeId}`);
              
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

