import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';

// Auth config for middleware (Edge Runtime compatible) — must not import
// anything that pulls in the `postgres` driver or other Node-only modules.
export const authConfig = {
  providers: [GitHub],
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
