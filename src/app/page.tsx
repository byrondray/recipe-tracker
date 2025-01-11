'use client';

import { useEffect, useState } from 'react';
import { getRecipes, filterRecipeByCategoryOrIngredient } from './action';
import { useRouter } from 'next/navigation';
import { Recipe } from './components/recipe';

interface Recipe {
  id: string;
  title: string;
  category: string;
  userId: string;
  imageUrl?: string;
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

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

  const handleSearch = async () => {
    try {
      if (searchQuery.trim() === '') {
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
        const result = await filterRecipeByCategoryOrIngredient(searchQuery);
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
    } catch (error) {
      setError('Error occurred while filtering recipes.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return <div className='text-center text-navyBlue'>Loading...</div>;
  }

  if (error) {
    return <div className='text-red-500 text-center'>{error}</div>;
  }

  return (
    <div className='min-h-screen bg-white flex flex-col items-center py-12'>
      <h1 className='text-3xl font-bold text-navyBlue mb-8'>Our Recipes</h1>

      {/* Search Input */}
      <div className='mb-8 w-full max-w-2xl'>
        <input
          type='text'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder='Search by category or ingredient'
          className='w-full px-4 py-2 border border-navyBlue rounded-md text-navyBlue'
        />
        <button
          onClick={handleSearch}
          className='mt-4 bg-yellow text-white px-4 py-2 rounded hover:bg-yellow-600'
        >
          Search
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full'>
        {recipes.map((recipe) => (
          <Recipe
            key={recipe.id}
            id={recipe.id}
            title={recipe.title}
            category={recipe.category}
            imageUrl={recipe.imageUrl}
            userId={recipe.userId}
          />
        ))}
      </div>
    </div>
  );
}
