'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { LogOut, TreePine, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardNav({ user, fullWidth = false }: { user: any; fullWidth?: boolean }) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8`}>
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/trees" className="flex items-center space-x-2">
              <TreePine className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">OST</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-gray-700">
                {user.email}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

