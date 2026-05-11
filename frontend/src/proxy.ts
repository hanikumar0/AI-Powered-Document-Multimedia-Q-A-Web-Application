import { NextRequest, NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard', '/upload', '/chat'];
  const publicRoutes = ['/login', '/register', '/'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*', '/chat/:path*', '/login', '/register'],
};
