'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaTrashAlt } from 'react-icons/fa';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRecipe, getCurrentUserData } from './action';
import { Recipe } from '@/db/schema/schema';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ShareButton } from '@/app/components/shareButton';

export default function RecipePage() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        const result = await getRecipe(id);
        const currentUser = await getCurrentUserData();
        if (result.success && result.success.recipe.length > 0) {
          setRecipe(result.success.recipe[0].recipe);
          setMedia(result.success.recipe[0].imageUrl);
          setCategory(result.success.recipe[0].category);
          if (currentUser.success?.session?.user) {
            setCurrentUserId(currentUser.success.session.user.id);
          }
        } else {
          throw new Error('Recipe not found');
        }
      } catch (err) {
        setError((err as Error).message || 'Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [params.id]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent'></div>
          <p className='mt-4 text-lg text-gray-600 animate-pulse'>
            Loading recipe details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-2xl shadow-xl p-8 max-w-md w-full transform transition-all duration-300 hover:scale-105'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-red-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <p className='text-red-600 text-lg font-medium'>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className='mt-4 bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition-colors duration-200'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-12 h-12 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
              />
            </svg>
          </div>
          <p className='text-xl text-gray-600'>Recipe not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50'>
      {/* Hero Section */}
      <div className='relative overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 text-white'>
        <div className='absolute inset-0 bg-black opacity-10'></div>
        <div className='relative container mx-auto px-4 py-16'>
          <div className='max-w-4xl mx-auto'>
            <div className='flex flex-col md:flex-row items-start gap-6'>
              <div className='flex-1'>
                <h1 className='text-4xl md:text-5xl font-bold mb-4 animate-fade-in-down'>
                  {recipe.title}
                </h1>
                {category && (
                  <div className='inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-lg font-medium mb-4'>
                    {category}
                  </div>
                )}
              </div>
              <div className='flex gap-3'>
                {currentUserId === recipe.userId && (
                  <button
                    onClick={() => router.push(`/editRecipe/${recipe.id}`)}
                    className='bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all duration-200 shadow-lg flex items-center gap-2'
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
                        d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                      />
                    </svg>
                    Edit Recipe
                  </button>
                )}
                <ShareButton recipe={recipe} />
              </div>
            </div>
          </div>
        </div>
        <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-50 to-transparent'></div>
      </div>

      <div className='container mx-auto px-4 -mt-8 relative z-10 pb-12'>
        <div className='bg-white rounded-2xl shadow-2xl max-w-6xl mx-auto overflow-hidden'>
          {/* Recipe Image */}
          <div className='relative h-96 bg-gray-100'>
            {media ? (
              <Image
                src={media}
                alt={recipe.title}
                fill
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px'
                priority
                className='object-cover'
              />
            ) : (
              <div className='w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center'>
                <div className='text-center'>
                  <svg
                    className='w-24 h-24 text-orange-300 mx-auto mb-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                  <p className='text-gray-600 text-lg'>No image available</p>
                </div>
              </div>
            )}
          </div>

          <div className='p-8 lg:p-12'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
              {/* Ingredients */}
              <div>
                <h3 className='text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6'>
                  Ingredients
                </h3>
                <div className='bg-gray-50 rounded-xl p-6 border border-gray-200'>
                  <ScrollArea className='h-[200px] w-full'>
                    {recipe.ingredients ? (
                      <div className='space-y-3'>
                        {recipe.ingredients
                          .split(',')
                          .map((ingredient, index) => (
                            <div
                              key={index}
                              className='flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100'
                            >
                              <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4'>
                                <span className='text-green-600 font-semibold text-sm'>
                                  {index + 1}
                                </span>
                              </div>
                              <span className='text-gray-700 flex-1'>
                                {ingredient.trim()}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className='text-center py-8'>
                        <svg
                          className='w-12 h-12 text-gray-300 mx-auto mb-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                          />
                        </svg>
                        <p className='text-gray-600'>
                          No ingredients available
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className='text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6'>
                  Cooking Steps
                </h3>
                <div className='bg-gray-50 rounded-xl p-6 border border-gray-200'>
                  <ScrollArea className='h-[200px] w-full'>
                    {recipe.steps ? (
                      <div className='space-y-3'>
                        {recipe.steps.split(',').map((step, index) => (
                          <div
                            key={index}
                            className='flex items-start p-4 bg-white rounded-lg shadow-sm border border-gray-100'
                          >
                            <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1'>
                              <span className='text-blue-600 font-semibold text-sm'>
                                {index + 1}
                              </span>
                            </div>
                            <span className='text-gray-700 flex-1 leading-relaxed'>
                              {step.trim()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-8'>
                        <svg
                          className='w-12 h-12 text-gray-300 mx-auto mb-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                          />
                        </svg>
                        <p className='text-gray-600'>
                          No cooking steps available
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
