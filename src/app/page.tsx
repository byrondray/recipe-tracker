'use client';

import { useEffect, useMemo, useState } from 'react';
import { getRecipes, filterRecipeByCategoryOrIngredient } from './action';
import { Recipe } from './components/recipe';
import { Pagination } from './components/pagination';
import { HomePageSkeleton } from './components/skeletons';
import { usePageTitle } from './components/usePageTitle';
import { Spinner } from '@/components/ui/spinner';

interface Recipe {
  id: string;
  title: string;
  category: string;
  userId: string;
  imageUrl?: string;
}

const RESULTS_PER_PAGE = 16;
const SEARCH_DEBOUNCE_MS = 300;

export default function HomePage() {
  usePageTitle('Home');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const result = await getRecipes();
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
          setError(result.error || 'Failed to fetch recipes');
        }
      } catch (error) {
        setError('Something went wrong while fetching recipes.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const runSearch = async () => {
      setIsSearching(true);
      try {
        if (debouncedQuery.trim() === '') {
          const result = await getRecipes();
          if (result.success?.recipes) {
            const formattedRecipes = result.success.recipes.map((r: any) => ({
              id: r.recipe.id,
              title: r.recipe.title,
              category: r.category.name,
              userId: r.recipe.userId,
              imageUrl: r.media?.url || undefined,
            }));
            setRecipes(formattedRecipes);
          }
        } else {
          const result = await filterRecipeByCategoryOrIngredient(
            debouncedQuery
          );
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
            setError(result.error || 'Failed to fetch filtered recipes');
          }
        }
        setCurrentPage(1);
      } catch (error) {
        setError('Error occurred while filtering recipes.');
      } finally {
        setIsSearching(false);
      }
    };

    if (!loading) {
      runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(recipes.length / RESULTS_PER_PAGE));

  const paginatedRecipes = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    return recipes.slice(start, start + RESULTS_PER_PAGE);
  }, [recipes, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <HomePageSkeleton />;
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
        <div className='relative container mx-auto px-4 py-16 text-center'>
          <h1 className='text-4xl md:text-6xl font-bold mb-4 animate-fade-in-down'>
            Discover Amazing Recipes
          </h1>
          <p className='text-lg md:text-xl opacity-90 animate-fade-in-up'>
            Share your culinary creations with the world
          </p>
        </div>
        <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-50 to-transparent'></div>
      </div>

      {/* Search Section */}
      <div className='container mx-auto px-4 -mt-8 relative z-10'>
        <div className='bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-3xl mx-auto transform transition-all duration-300 hover:shadow-3xl'>
          <div className='relative'>
            <label htmlFor='recipe-search' className='sr-only'>
              Search recipes by category or ingredient
            </label>
            <input
              id='recipe-search'
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by category or ingredient...'
              aria-busy={isSearching}
              className='w-full px-6 py-4 pr-12 border-2 border-gray-200 rounded-full text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:outline-none transition-all duration-200'
            />
            {isSearching ? (
              <div className='absolute right-4 top-1/2 -translate-y-1/2 text-orange-400'>
                <Spinner size={24} borderWidth={3} />
              </div>
            ) : (
              <svg
                className='absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            )}
          </div>
        </div>
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
                  d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                />
              </svg>
            </div>
            <p className='text-xl text-gray-600'>No recipes found</p>
            <p className='text-gray-600 mt-2'>
              Try searching with different keywords
            </p>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8'>
              {paginatedRecipes.map((recipe, index) => (
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

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
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
