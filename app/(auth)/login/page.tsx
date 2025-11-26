'use client';

import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to OST
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Opportunity Solution Tree Collaboration Tool
          </p>
        </div>
        {error === 'auth_failed' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Authentication failed. Please try again or request a new magic link.
          </div>
        )}
        <LoginForm />
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

