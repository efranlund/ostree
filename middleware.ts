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

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isProtectedRoute = pathname.startsWith('/trees');

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // For auth pages, skip Supabase calls entirely to prevent blocking
  // Client-side code will handle redirects if user is already logged in
  if (isAuthPage) {
    return response;
  }

  // For protected routes, we need to verify the session
  if (isProtectedRoute) {
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

    let session = null;

    try {
      // Use getSession() - reads from cookies, should be fast
      const result = await withTimeout(
        supabase.auth.getSession(),
        2000
      );

      if (result) {
        session = result.data.session;
      } else {
        console.error('Supabase getSession() timed out after 2 seconds');
        // Redirect to login if session check fails on protected route
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      console.error('Error in middleware auth check:', error);
      // Redirect to login on error for protected routes
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const user = session?.user ?? null;

    // Protect dashboard routes
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Exclude home route since it just redirects
    '/trees/:path*',
    '/login',
    '/signup',
  ],
};

