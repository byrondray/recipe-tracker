import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';

// Auth config for middleware (Edge Runtime compatible) — must not import
// anything that pulls in the `postgres` driver or other Node-only modules.
//
// session.strategy is pinned to 'jwt' here so it matches fullAuthConfig
// (src/auth.ts). NextAuth defaults to 'database' sessions whenever an
// adapter is present, but only fullAuthConfig has the DrizzleAdapter —
// this config (used by middleware) doesn't. Without an explicit shared
// strategy, middleware tries to decrypt the DB session token as a JWT
// and fails with "Invalid Compact JWE".
export const authConfig = {
  providers: [GitHub],
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const paths = [
        '/editRecipe',
        '/createRecipe',
        '/exploreRecipes',
        '/viewRecipes',
      ];
      const isProtected = paths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtected && !isLoggedIn) {
        const redirectUrl = new URL('api/auth/signin', nextUrl.origin);
        redirectUrl.searchParams.append('callbackUrl', nextUrl.href);
        return Response.redirect(redirectUrl);
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
