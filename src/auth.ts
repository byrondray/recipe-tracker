import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { authConfig } from './auth.config';

export { authConfig };

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
