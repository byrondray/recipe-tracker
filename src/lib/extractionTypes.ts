export interface ExtractedRecipe {
  title?: string;
  ingredients?: string[];
  steps?: string[];
  imageUrl?: string;
  sourceUrl: string;
}

export type ExtractRecipeFailureReason = 'blocked' | 'unreachable' | 'no_recipe_data';

export class ExtractRecipeError extends Error {
  constructor(public reason: ExtractRecipeFailureReason, message: string) {
    super(message);
    this.name = 'ExtractRecipeError';
  }
}
