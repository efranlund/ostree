import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Timeout wrapper to prevent middleware from hanging
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T | null> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

export async function middleware(request: NextRequest) {
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;

  try {
    // Add 10-second timeout to prevent hanging
    const result = await withTimeout(
      supabase.auth.getUser(),
      10000
    );

    if (result) {
      user = result.data.user;
    } else {
      console.error('Supabase getUser() timed out after 10 seconds');
      // Allow request to proceed without auth check
      return response;
    }
  } catch (error) {
    console.error('Error in middleware auth check:', error);
    // Allow request to proceed without auth check on error
    return response;
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/trees') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/trees', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Only run middleware on specific routes
    '/',
    '/trees/:path*',
    '/login',
    '/signup',
  ],
};

