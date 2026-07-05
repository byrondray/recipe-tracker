import {
  timestamp,
  pgTable,
  text,
  index,
  uniqueIndex,
  integer,
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
    media: text('media').references(() => media.id, { onDelete: 'set null' }),
    category: text('category')
      .references(() => category.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
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

export const favouriteRecipe = pgTable(
  'favouriteRecipe',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipeId: text('recipeId')
      .notNull()
      .references(() => recipe.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (favouriteRecipe) => ({
    userIdIdx: index('favouriteRecipe_userId_idx').on(favouriteRecipe.userId),
    recipeIdIdx: index('favouriteRecipe_recipeId_idx').on(
      favouriteRecipe.recipeId
    ),
    userRecipeUniqueIdx: uniqueIndex('favouriteRecipe_userId_recipeId_idx').on(
      favouriteRecipe.userId,
      favouriteRecipe.recipeId
    ),
  })
);

export type FavouriteRecipe = typeof favouriteRecipe.$inferSelect;
export type InsertFavouriteRecipe = typeof favouriteRecipe.$inferInsert;

export const review = pgTable(
  'review',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipeId: text('recipeId')
      .notNull()
      .references(() => recipe.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (review) => ({
    userIdIdx: index('review_userId_idx').on(review.userId),
    recipeIdIdx: index('review_recipeId_idx').on(review.recipeId),
    userRecipeUniqueIdx: uniqueIndex('review_userId_recipeId_idx').on(
      review.userId,
      review.recipeId
    ),
  })
);

export type Review = typeof review.$inferSelect;
export type InsertReview = typeof review.$inferInsert;

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
