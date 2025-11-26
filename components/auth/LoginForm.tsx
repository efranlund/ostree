'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getSiteUrl } from '@/lib/utils/siteUrl';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Check configuration on mount
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setConfigError('Supabase environment variables are missing. Please check your .env.local file.');
      return;
    }

    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      setConfigError(`Invalid Supabase URL format: ${supabaseUrl.substring(0, 50)}...`);
      return;
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Verify environment variables are available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }

      // Add timeout to prevent hanging if Supabase is unreachable
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please check your internet connection and Supabase URL.')), 10000)
      );

      const siteUrl = getSiteUrl();
      console.log('Attempting to send magic link:', { email, siteUrl, supabaseUrl });

      const signInPromise = supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      const result = await Promise.race([signInPromise, timeoutPromise]);

      if (result.error) {
        console.error('Supabase auth error:', result.error);
        throw result.error;
      }

      console.log('Magic link sent successfully');
      setSuccess(true);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide more helpful error messages
      let errorMessage = '';
      
      // Check for specific error types
      const errorStr = error.message || error.toString() || '';
      
      if (errorStr.includes('CORS') || errorStr.includes('Access-Control-Allow-Origin')) {
        errorMessage = 'CORS Error: Cannot connect to Supabase.\n\n';
        errorMessage += 'This usually means your Supabase project is PAUSED.\n\n';
        errorMessage += 'To fix:\n';
        errorMessage += '1. Go to https://supabase.com/dashboard\n';
        errorMessage += '2. Find your project: zhvkqdjzvkrkmrmyhswy\n';
        errorMessage += '3. Click "Restore" or "Resume" to unpause it\n';
        errorMessage += '4. Wait a few minutes for it to fully start\n';
        errorMessage += '5. Try again';
      } else if (errorStr.includes('522') || errorStr.includes('timeout') || errorStr.includes('timed out')) {
        errorMessage = 'Connection Timeout (522 Error).\n\n';
        errorMessage += 'Your Supabase project appears to be paused or unreachable.\n\n';
        errorMessage += 'Please check:\n';
        errorMessage += '1. Go to https://supabase.com/dashboard\n';
        errorMessage += '2. Verify your project is active (not paused)\n';
        errorMessage += '3. If paused, click "Restore" and wait a few minutes';
      } else if (errorStr.includes('Failed to fetch') || errorStr.includes('NetworkError')) {
        errorMessage = 'Network Error: Cannot connect to Supabase.\n\n';
        errorMessage += 'Possible causes:\n';
        errorMessage += '1. Supabase project is paused (most common)\n';
        errorMessage += '2. Internet connection issue\n';
        errorMessage += '3. Incorrect Supabase URL\n\n';
        errorMessage += 'Check your Supabase dashboard to ensure the project is active.';
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An unexpected error occurred. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded space-y-2">
        <p className="font-medium">Check your email!</p>
        <p className="text-sm">
          We've sent you a magic link to sign in. Click the link in your email to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {configError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
          <p className="font-medium">Configuration Issue:</p>
          <p className="mt-1">{configError}</p>
          <p className="mt-2 text-xs">
            Check your browser console for more details. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.
          </p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded whitespace-pre-line text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending magic link...' : 'Send Magic Link'}
      </button>
      <p className="text-sm text-gray-600 text-center">
        We'll send you a secure link to sign in without a password.
      </p>
    </form>
  );
}

