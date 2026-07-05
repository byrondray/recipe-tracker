import { users, recipe, category } from '@/db/schema/schema';
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
  const usersExist = (await db.select().from(users)).length > 0;
  if (usersExist) {
    await db.delete(users);
  }

  const recipesExist = (await db.select().from(recipe)).length > 0;
  if (recipesExist) {
    await db.delete(recipe);
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
