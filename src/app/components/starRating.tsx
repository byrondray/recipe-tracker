'use client';

import { useState } from 'react';
import { FaStar } from 'react-icons/fa';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function StarRating({
  value,
  onChange,
  size = 'md',
  readOnly = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value;
  const starClass = sizeClasses[size];

  if (readOnly) {
    return (
      <div className='flex items-center gap-0.5' aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`${starClass} ${
              star <= Math.round(value) ? 'text-orange-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className='flex items-center gap-1'
      role='radiogroup'
      aria-label='Rating'
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type='button'
          role='radio'
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onMouseEnter={() => setHovered(star)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(null)}
          onClick={() => onChange?.(star)}
          className='p-1 rounded-full transition-transform duration-150 hover:scale-110'
        >
          <FaStar
            className={`${starClass} transition-colors duration-150 ${
              star <= displayValue ? 'text-orange-400' : 'text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
