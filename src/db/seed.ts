import { users, recipe, category } from '@/db/schema/schema';
import { db } from '@/lib/db';
import { v4 as uuid } from 'uuid';

const categoriesSeed = [
  'Breakfast',
  'Italian',
  'Fast Food',
  'Chinese',
  'Health',
  'Protein',
];

const resetAndSeedCategories = async () => {
  await db.delete(recipe);
  await db.delete(users);
  await db.delete(category);

  for (const name of categoriesSeed) {
    await db.insert(category).values({ id: uuid(), name });
  }

  console.log(`Seeded ${categoriesSeed.length} categories.`);
};

(async () => {
  await resetAndSeedCategories();
})();
