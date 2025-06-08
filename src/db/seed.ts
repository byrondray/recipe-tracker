import {
  authenticators,
  users,
  recipe,
  sessions,
  accounts,
  verificationTokens,
  category,
} from '@/db/schema/schema';
import { db } from '@/lib/db';
import { v4 as uuid } from 'uuid';

const categoiresSeed = [
  'Breakfast',
  'Italian',
  'Fast Food',
  'Chinese',
  'Health',
];

const dropTables = async () => {
  const authenticatorsExist =
    (await db.select().from(authenticators)).length > 0;
  if (authenticatorsExist) {
    await db.delete(authenticators);
  }

  const usersExist = (await db.select().from(users)).length > 0;
  if (usersExist) {
    await db.delete(users);
  }

  const recipesExist = (await db.select().from(recipe)).length > 0;
  if (recipesExist) {
    await db.delete(recipe);
  }

  const sessionsExist = (await db.select().from(sessions)).length > 0;
  if (sessionsExist) {
    await db.delete(sessions);
  }

  const accountsExist = (await db.select().from(accounts)).length > 0;
  if (accountsExist) {
    await db.delete(accounts);
  }

  const verificationTokensExist =
    (await db.select().from(verificationTokens)).length > 0;
  if (verificationTokensExist) {
    await db.delete(verificationTokens);
  }

  const categoriesExist = (await db.select().from(category)).length > 0;
  if (categoriesExist) {
    await db.delete(category);

    for (const categoryy of categoiresSeed) {
      await db.insert(category).values({ id: uuid(), name: categoryy });
    }

    console.log('All tables dropped successfully');
  }
};

(async () => {
  await dropTables();
})();
