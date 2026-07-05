import 'server-only';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/schema';
import { eq } from 'drizzle-orm';

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

// Clerk owns the canonical user record; this mirrors the signed-in user into
// our local `users` table so `recipe.userId`/`media.userId` have something to
// FK against, then returns a NextAuth-shaped session so existing call sites
// (session.user.id) didn't need to change.
export async function auth(): Promise<AppSession | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.username ||
    'User';
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? '';
  const image = clerkUser.imageUrl ?? null;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, clerkUser.id))
    .limit(1);

  if (!existing) {
    await db.insert(users).values({ id: clerkUser.id, name, email, image });
  } else if (
    existing.name !== name ||
    existing.email !== email ||
    existing.image !== image
  ) {
    await db
      .update(users)
      .set({ name, email, image })
      .where(eq(users.id, clerkUser.id));
  }

  return { user: { id: clerkUser.id, name, email, image } };
}
