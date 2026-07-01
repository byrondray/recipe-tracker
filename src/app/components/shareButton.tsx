'use client';

import { useState } from 'react';
import { type Recipe } from '@/db/schema/schema';

export const ShareButton = ({
  recipe,
  className = '',
}: {
  recipe: Recipe;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const shareRecipe = async () => {
    const url = `${window.location.origin}/recipe/${recipe.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing', error);
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={shareRecipe}
      className={`bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all duration-200 shadow-lg flex items-center gap-2 ${className}`}
    >
      <svg
        className='w-5 h-5'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
        />
      </svg>
      {copied ? 'Link copied!' : 'Share Recipe'}
    </button>
  );
};
