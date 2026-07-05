'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFavouriteRecipes } from './action';
import { getCurrentUserData } from '../recipe/[id]/action';
import { Recipe } from '../components/recipe';
import { usePageTitle } from '../components/usePageTitle';
import { FavouritesPageSkeleton } from '../components/skeletons';

interface FavouriteRecipeItem {
  id: string;
  title: string;
  category: string;
  userId: string;
  imageUrl?: string;
}

export default function FavouritesPage() {
  usePageTitle('Favourites');

  const [recipes, setRecipes] = useState<FavouriteRecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const currentUser = await getCurrentUserData();
        const userId = currentUser.success?.session?.user?.id ?? null;
        setCurrentUserId(userId);

        if (!userId) {
          setError('You must be signed in to view your favourites.');
          return;
        }

        const result = await getFavouriteRecipes();
        if (result.success?.recipes) {
          const formattedRecipes = result.success.recipes.map((r: any) => ({
            id: r.recipe.id,
            title: r.recipe.title,
            category: r.category.name,
            userId: r.recipe.userId,
            imageUrl: r.media?.url || undefined,
          }));
          setRecipes(formattedRecipes);
        } else {
          setError(result.error || 'Failed to fetch favourite recipes');
        }
      } catch (error) {
        setError('Something went wrong while fetching your favourites.');
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, []);

  if (loading) {
    return <FavouritesPageSkeleton />;
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
              onClick={() => router.push('/')}
              className='mt-4 bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition-colors duration-200'
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50'>
      {/* Hero Section */}
      <div className='relative overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 text-white'>
        <div className='absolute inset-0 bg-black opacity-10'></div>
        <div className='relative container mx-auto px-4 py-16 text-center'>
          <h1 className='text-4xl md:text-6xl font-heading font-semibold mb-4 animate-fade-in-down'>
            Your Favourites
          </h1>
          <p className='text-lg md:text-xl opacity-90 animate-fade-in-up'>
            The recipes you&apos;ve saved for later
          </p>
        </div>
        <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-50 to-transparent'></div>
      </div>

      {/* Recipes Grid */}
      <div className='container mx-auto px-4 py-12'>
        {recipes.length === 0 ? (
          <div className='text-center py-16'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-12 h-12 text-gray-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                />
              </svg>
            </div>
            <p className='text-xl text-gray-600'>No favourites yet</p>
            <p className='text-gray-600 mt-2'>
              Tap the heart on any recipe to save it here
            </p>
            <button
              onClick={() => router.push('/')}
              className='mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg'
            >
              Explore Recipes
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8'>
            {recipes.map((recipe, index) => (
              <div
                key={recipe.id}
                className='animate-fade-in-up'
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Recipe
                  id={recipe.id}
                  title={recipe.title}
                  category={recipe.category}
                  imageUrl={recipe.imageUrl}
                  userId={recipe.userId}
                  currentUserId={currentUserId}
                  onUnfavourited={(id) =>
                    setRecipes((prev) => prev.filter((r) => r.id !== id))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

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

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
}
