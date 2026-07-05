import { safeFetch, UnsafeUrlError } from '@/lib/safeFetch';

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

type JsonLdNode = Record<string, unknown>;

const BOT_BLOCK_STATUS_CODES = new Set([401, 402, 403, 429]);

export async function extractRecipeFromUrl(
  url: string
): Promise<ExtractedRecipe | null> {
  let html: string;
  let res: Response;
  try {
    res = await safeFetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CookBookPlusBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      throw new ExtractRecipeError('unreachable', error.message);
    }
    throw new ExtractRecipeError(
      'unreachable',
      'Could not reach that page.'
    );
  }

  if (!res.ok) {
    if (BOT_BLOCK_STATUS_CODES.has(res.status) || res.headers.get('server') === 'cloudflare') {
      throw new ExtractRecipeError(
        'blocked',
        'This site blocks automated imports.'
      );
    }
    throw new ExtractRecipeError(
      'unreachable',
      `The page returned an error (status ${res.status}).`
    );
  }

  html = await res.text();

  for (const block of extractJsonLdBlocks(html)) {
    const recipeNode = findRecipeNode(block);
    if (recipeNode) return normalizeRecipeNode(recipeNode, url);
  }

  throw new ExtractRecipeError(
    'no_recipe_data',
    'No structured recipe data found on that page.'
  );
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      // skip malformed block
    }
  }
  return blocks;
}

function findRecipeNode(node: unknown): JsonLdNode | null {
  if (Array.isArray(node)) {
    for (const n of node) {
      const found = findRecipeNode(n);
      if (found) return found;
    }
    return null;
  }
  if (node && typeof node === 'object') {
    const obj = node as JsonLdNode;
    const type = obj['@type'];
    if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
      return obj;
    }
    if (obj['@graph']) return findRecipeNode(obj['@graph']);
  }
  return null;
}

function normalizeRecipeNode(
  node: JsonLdNode,
  sourceUrl: string
): ExtractedRecipe {
  return {
    title: typeof node.name === 'string' ? node.name : undefined,
    ingredients: Array.isArray(node.recipeIngredient)
      ? node.recipeIngredient
          .map((s: unknown) => String(s).trim())
          .filter(Boolean)
      : undefined,
    steps: normalizeInstructions(node.recipeInstructions),
    imageUrl: normalizeImage(node.image),
    sourceUrl,
  };
}

function normalizeInstructions(instructions: unknown): string[] | undefined {
  if (!instructions) return undefined;
  if (typeof instructions === 'string') {
    return instructions
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(instructions)) {
    return instructions
      .map((step: unknown) => {
        if (typeof step === 'string') return step.trim();
        if (step && typeof step === 'object') {
          const stepNode = step as JsonLdNode;
          if (
            stepNode['@type'] === 'HowToSection' &&
            Array.isArray(stepNode.itemListElement)
          ) {
            return stepNode.itemListElement
              .map((s: unknown) => {
                const item = s as JsonLdNode;
                return (item?.text as string) || (item?.name as string) || '';
              })
              .join(' ');
          }
          return (
            (stepNode.text as string) || (stepNode.name as string) || ''
          );
        }
        return '';
      })
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

function normalizeImage(image: unknown): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return normalizeImage(image[0]);
  if (typeof image === 'object') {
    return (image as JsonLdNode).url as string | undefined;
  }
  return undefined;
}
