'use client';

import { useEffect, useState } from 'react';
import { getRecipesForUser } from './action';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Recipe } from '../../components/recipe';
import { getUserData } from './action';
import { Spinner } from '@/components/ui/spinner';
import { User } from '@/db/schema/schema';

interface Recipe {
  id: string;
  title: string;
  category: string;
  userId: string;
  imageUrl?: string;
}

export default function UserRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  console.log(recipes, 'recipes');

  useEffect(() => {
    const fetchUserAndRecipes = async () => {
      try {
        const userResult = await getUserData();
        if (userResult.success?.user) {
          const currentUser = userResult.success.user[0];
          setCurrentUser(currentUser);

          setUserId(currentUser.id);

          const result = await getRecipesForUser();
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
            setError(result.error || 'Failed to fetch user recipes');
          }
        } else {
          setError('Failed to fetch user data');
        }
      } catch (error) {
        setError('Something went wrong while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndRecipes();
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent'></div>
          <p className='mt-4 text-lg text-gray-600 animate-pulse'>
            Loading profile...
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

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50'>
      {/* Hero Section */}
      <div className='relative overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 text-white'>
        <div className='absolute inset-0 bg-black opacity-10'></div>
        <div className='relative container mx-auto px-4 py-16'>
          <div className='max-w-4xl mx-auto text-center'>
            <h1 className='text-4xl md:text-6xl font-bold mb-4 animate-fade-in-down'>
              My Profile
            </h1>
            <p className='text-lg md:text-xl opacity-90 animate-fade-in-up'>
              Welcome to your culinary collection
            </p>
          </div>
        </div>
        <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-50 to-transparent'></div>
      </div>

      <div className='container mx-auto px-4 -mt-8 relative z-10 pb-12'>
        {/* User Info Card */}
        <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto mb-12 transform transition-all duration-300 hover:shadow-3xl'>
          <div className='flex flex-col md:flex-row items-center gap-8'>
            <div className='relative'>
              {currentUser?.image ? (
                <Image
                  src={currentUser.image}
                  alt='User Avatar'
                  width={128}
                  height={128}
                  className='w-32 h-32 rounded-full border-4 border-orange-400 shadow-lg'
                />
              ) : (
                <div className='w-32 h-32 bg-gradient-to-br from-orange-100 to-red-100 rounded-full border-4 border-orange-400 flex items-center justify-center'>
                  <svg
                    className='w-16 h-16 text-orange-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </div>
              )}
              <div className='absolute -bottom-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg'>
                <svg
                  className='w-4 h-4'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
            </div>

            <div className='flex-1 text-center md:text-left'>
              <h2 className='text-3xl font-bold text-gray-800 mb-4'>
                {currentUser?.name}
              </h2>
              <div className='space-y-2'>
                <div className='flex items-center justify-center md:justify-start text-gray-600'>
                  <svg
                    className='w-5 h-5 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                    />
                  </svg>
                  <span>{currentUser?.email}</span>
                </div>
                <div className='flex items-center justify-center md:justify-start text-gray-600'>
                  <svg
                    className='w-5 h-5 mr-2'
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
                  <span>{recipes.length} Recipes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recipes Section */}
        <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-7xl mx-auto'>
          <div className='text-center mb-8'>
            <h2 className='text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4'>
              My Recipes
            </h2>
            <p className='text-gray-600 text-lg'>
              Discover the delicious creations you&apos;ve shared
            </p>
          </div>

          {recipes.length === 0 ? (
            <div className='text-center py-16'>
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
              <p className='text-xl text-gray-600 mb-2'>No recipes yet</p>
              <p className='text-gray-600 mb-6'>
                Start creating and sharing your favorite recipes!
              </p>
              <button
                onClick={() => router.push('/createRecipe')}
                className='bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg'
              >
                Create Your First Recipe
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
                  />
                </div>
              ))}
            </div>
          )}
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
