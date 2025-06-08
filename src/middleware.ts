import NextAuth from 'next-auth';
import { authConfig } from './auth';

export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // Protect all routes except home page, API routes, and static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - / (home page only)
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
  ],
};
