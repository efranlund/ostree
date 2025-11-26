/**
 * Gets the site URL for the current environment.
 * 
 * In production (Vercel), this should be set via NEXT_PUBLIC_SITE_URL.
 * In local development, it falls back to window.location.origin.
 * 
 * @returns The site URL (e.g., https://yourdomain.com or http://localhost:3000)
 */
export function getSiteUrl(): string {
  // In client-side code, use the environment variable if available
  // Otherwise fall back to window.location.origin for local development
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  }
  
  // Server-side fallback (shouldn't be used in client components)
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

