import Anthropic from '@anthropic-ai/sdk';
import { safeFetch, UnsafeUrlError } from '@/lib/safeFetch';
import { ExtractedRecipe, ExtractRecipeError } from '@/lib/extractionTypes';

const INSTAGRAM_HOSTNAMES = new Set([
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
]);

export function isInstagramUrl(rawUrl: string): boolean {
  try {
    return INSTAGRAM_HOSTNAMES.has(new URL(rawUrl).hostname.toLowerCase());
  } catch {
    return false;
  }
}

// Instagram serves og: meta tags to browser-looking requests but login-walls
// obvious bots, so this deliberately does not use the CookBookPlusBot UA.
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

export async function extractRecipeFromInstagram(
  url: string
): Promise<ExtractedRecipe> {
  const { caption, imageUrl } = await fetchInstagramPostMeta(url);
  const parsed = await parseCaptionWithClaude(caption);

  if (!parsed.is_recipe) {
    throw new ExtractRecipeError(
      'no_recipe_data',
      'This Instagram post does not appear to contain a recipe.'
    );
  }

  return {
    title: parsed.title || undefined,
    ingredients: parsed.ingredients.length ? parsed.ingredients : undefined,
    steps: parsed.steps.length ? parsed.steps : undefined,
    imageUrl,
    sourceUrl: url,
  };
}

async function fetchInstagramPostMeta(
  url: string
): Promise<{ caption: string; imageUrl?: string }> {
  let res: Response;
  try {
    res = await safeFetch(url, {
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      throw new ExtractRecipeError('unreachable', error.message);
    }
    throw new ExtractRecipeError('unreachable', 'Could not reach Instagram.');
  }

  if (!res.ok) {
    throw new ExtractRecipeError(
      'blocked',
      `Instagram refused the request (status ${res.status}).`
    );
  }

  const html = await res.text();
  const ogTitle = extractMetaContent(html, 'og:title');
  const ogDescription = extractMetaContent(html, 'og:description');
  const ogImage = extractMetaContent(html, 'og:image');

  // A login-walled response has no post-specific og:description.
  if (!ogDescription && !ogTitle) {
    throw new ExtractRecipeError(
      'blocked',
      'Instagram served a login page instead of the post.'
    );
  }

  const caption = [ogTitle, ogDescription].filter(Boolean).join('\n\n');
  return { caption, imageUrl: ogImage || undefined };
}

function extractMetaContent(html: string, property: string): string | null {
  // Attribute order varies: property before content and vice versa.
  const patterns = [
    new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
      'i'
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]).trim() || null;
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

interface ParsedCaptionRecipe {
  is_recipe: boolean;
  title: string;
  ingredients: string[];
  steps: string[];
}

const RECIPE_SCHEMA = {
  type: 'object',
  properties: {
    is_recipe: {
      type: 'boolean',
      description: 'True only if the caption contains an actual recipe.',
    },
    title: {
      type: 'string',
      description: 'A short dish name, or an empty string if unknown.',
    },
    ingredients: { type: 'array', items: { type: 'string' } },
    steps: { type: 'array', items: { type: 'string' } },
  },
  required: ['is_recipe', 'title', 'ingredients', 'steps'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You extract cooking recipes from Instagram post captions.
The caption may start with engagement boilerplate ("123 likes, 4 comments - user on date:") — ignore it.
Extract the dish title, the ingredient list (one entry per ingredient, keeping quantities), and the preparation steps (one entry per step, imperative voice).
IMPORTANT: never use a comma inside a single ingredient or step — rephrase with parentheses or "and" instead, because the app stores these lists comma-separated.
If the caption describes food but contains no usable recipe (no ingredients and no steps), set is_recipe to false.`;

async function parseCaptionWithClaude(
  caption: string
): Promise<ParsedCaptionRecipe> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      'ANTHROPIC_API_KEY is not set — Instagram recipe import needs it.'
    );
    throw new ExtractRecipeError(
      'no_recipe_data',
      'Instagram import is not configured on this server.'
    );
  }

  const client = new Anthropic();
  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: 'json_schema', schema: RECIPE_SCHEMA },
      },
      messages: [{ role: 'user', content: caption }],
    });
  } catch (error) {
    console.error('Claude caption extraction failed:', error);
    throw new ExtractRecipeError(
      'no_recipe_data',
      'Could not extract a recipe from this Instagram post.'
    );
  }

  if (response.stop_reason === 'refusal') {
    throw new ExtractRecipeError(
      'no_recipe_data',
      'Could not extract a recipe from this Instagram post.'
    );
  }

  const text = response.content.find((block) => block.type === 'text')?.text;
  if (!text) {
    throw new ExtractRecipeError(
      'no_recipe_data',
      'Could not extract a recipe from this Instagram post.'
    );
  }

  return JSON.parse(text) as ParsedCaptionRecipe;
}
