import {
  timestamp,
  pgTable,
  text,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  image: text('image'),
});

export type User = typeof users.$inferInsert;

export const recipe = pgTable(
  'recipe',
  {
    id: text('id').primaryKey().notNull(),
    title: text('title').notNull(),
    ingredients: text('ingredients').notNull(),
    steps: text('steps'),
    media: text('media').references(() => media.id, { onDelete: 'cascade' }),
    category: text('category')
      .references(() => category.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (recipe) => ({
    userIdIdx: index('recipe_userId_idx').on(recipe.userId),
    categoryIdx: index('recipe_category_idx').on(recipe.category),
  })
);

export const category = pgTable('category', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
});

export type Recipe = typeof recipe.$inferSelect;
export type InsertRecipe = typeof recipe.$inferInsert;

export const media = pgTable(
  'media',
  {
    id: text('id').primaryKey().notNull(),
    url: text('url').notNull(),
    type: text('type').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull(),
  },
  (media) => ({
    userIdIdx: index('media_userId_idx').on(media.userId),
  })
);

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;
