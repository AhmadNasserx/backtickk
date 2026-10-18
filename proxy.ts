import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/auth.config';

/*
 * Optimistic gate for authenticated pages: redirects anonymous visitors to sign-in.
 * It only checks that a session exists; pages and APIs re-validate on the server.
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth((request) => {
  if (request.auth) {
    return NextResponse.next();
  }
  const signInUrl = new URL('/signin', request.nextUrl.origin);
  signInUrl.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ['/dashboard/:path*', '/bookmarks/:path*', '/settings/:path*', '/create/:path*', '/blogs/:slug/edit', '/blogs/:slug/preview'],
};
