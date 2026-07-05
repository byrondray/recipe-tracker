import { NextRequest, NextResponse } from 'next/server';

function extractFirstUrl(input: string): string | null {
  if (!input) return null;
  const match = input.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const sharedTitle = (formData.get('title') as string) || '';
  const sharedText = (formData.get('text') as string) || '';
  const sharedUrlField = (formData.get('url') as string) || '';

  const candidateUrl =
    extractFirstUrl(sharedUrlField) ||
    extractFirstUrl(sharedText) ||
    extractFirstUrl(sharedTitle);

  const destination = new URL('/createRecipe', request.url);
  if (candidateUrl) destination.searchParams.set('sharedUrl', candidateUrl);
  if (sharedTitle) {
    destination.searchParams.set('sharedTitle', sharedTitle);
  } else if (sharedText) {
    destination.searchParams.set('sharedTitle', sharedText);
  }

  return NextResponse.redirect(destination, { status: 303 });
}
