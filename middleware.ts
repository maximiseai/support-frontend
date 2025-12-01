import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that DON'T require authentication (login/OTP only)
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/otp',
];

// Restricted paths that only specific users can access (even after login)
const RESTRICTED_PATHS: Record<string, string[]> = {
  '/users': ['vinayak@enrich.so'],
  '/api/users': ['vinayak@enrich.so'],
};

// Static file extensions to ignore
const STATIC_FILE_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (STATIC_FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Skip Next.js internal routes
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const session = request.cookies.get('support_session');
  const userEmail = request.cookies.get('support_user_email')?.value?.toLowerCase();

  // Check if the current path is public (login/OTP only)
  const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));

  // CRITICAL: If user is NOT authenticated and trying to access ANY protected route
  // They can ONLY see login and OTP pages
  if (!session?.value) {
    if (!isPublicPath) {
      // Not logged in and trying to access protected route - redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    // Allow access to public paths (login/OTP)
    return NextResponse.next();
  }

  // User IS authenticated from here onwards

  // If authenticated user tries to access login page, redirect to home
  if (pathname === '/login') {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Check restricted paths - only allowed users can access
  for (const [restrictedPath, allowedEmails] of Object.entries(RESTRICTED_PATHS)) {
    if (pathname.startsWith(restrictedPath)) {
      if (!userEmail || !allowedEmails.includes(userEmail)) {
        // For API routes, return 403 JSON response
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Access denied. You do not have permission to access this feature.' },
            { status: 403 }
          );
        }
        // For page routes, redirect to home with access denied
        const homeUrl = new URL('/', request.url);
        homeUrl.searchParams.set('error', 'access_denied');
        return NextResponse.redirect(homeUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match ALL routes except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - Static assets with file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // Ensure all page and API routes are matched
    '/',
    '/login',
    '/teams/:path*',
    '/credits/:path*',
    '/users/:path*',
    '/apis/:path*',
    '/sales-nav-accounts/:path*',
    '/api/:path*',
  ],
};
