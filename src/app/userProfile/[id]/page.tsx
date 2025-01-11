'use client';

import { useEffect, useState } from 'react';
import { getRecipesForUser } from './action';
import { useRouter } from 'next/navigation';
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
      <div className='flex text-center text-navyBlue items-center justify-center min-h-screen'>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className='text-red-500 text-center'>{error}</div>;
  }

  return (
    <div className='min-h-screen bg-white flex flex-col items-center py-12'>
      <h1 className='text-3xl font-bold text-navyBlue mb-8'>User Info</h1>
      <div className='flex items-center flex-row space-x-4 mb-4'>
        <div className='flex flex-col mr-4'>
          <p className='text-lg text-navyBlue'>
            <span className='font-bold'>Email:</span> {currentUser?.email}
          </p>
          <p className='text-lg text-navyBlue'>
            <span className='font-bold'>Name:</span> {currentUser?.name}
          </p>
        </div>
        {currentUser?.image && (
          <img
            src={currentUser?.image}
            alt='avatar'
            width={100}
            height={100}
            className='rounded-full'
          />
        )}
      </div>

      <h1 className='text-3xl font-bold text-navyBlue mb-8'>My Recipes</h1>

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
