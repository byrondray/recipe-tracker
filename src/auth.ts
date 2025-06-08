import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';

// Auth config for middleware (Edge Runtime compatible)
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

// Full auth config with adapter (for non-middleware use)
const fullAuthConfig = {
  ...authConfig,
  adapter: DrizzleAdapter(db),
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signOut } = NextAuth(fullAuthConfig);
