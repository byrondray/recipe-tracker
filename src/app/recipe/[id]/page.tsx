'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaTrashAlt } from 'react-icons/fa';
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
      <div className='flex justify-center items-center min-h-screen bg-white'>
        <Spinner className='w-12 h-12 border-4 border-navyBlue border-t-transparent animate-spin' />
      </div>
    );
  }

  if (error) {
    return <div className='text-red-500 text-center'>{error}</div>;
  }

  if (!recipe) {
    return <div className='text-center'>Recipe not found</div>;
  }

  return (
    <div className='flex justify-center py-12 min-h-screen bg-white'>
      <div className='bg-gray-100 shadow-md rounded-lg px-8 pt-6 pb-8 mb-4 w-full max-w-4xl border border-navyBlue'>
        {currentUserId === recipe.userId && (
          <Button
            onClick={() => router.push(`/editRecipe/${recipe.id}`)}
            className='bg-navyBlue text-antiWhite mb-4'
          >
            Edit
          </Button>
        )}
        <ShareButton recipe={recipe} />
        {/* Recipe Image */}
        <div className='mb-6'>
          {media ? (
            <img
              src={media}
              alt={recipe.title}
              className='w-full h-auto rounded-md object-cover'
              style={{ maxWidth: '600px', maxHeight: '400px' }}
            />
          ) : (
            <p className='text-gray-500'>No image provided</p>
          )}
        </div>

        {/* Recipe Information */}
        <div className='mb-4'>
          <h2 className='text-2xl font-bold text-navyBlue mb-2'>
            {recipe.title}
          </h2>

          {/* Category */}
          {category && (
            <p className='text-gray-600 italic mb-4'>Category: {category}</p>
          )}
        </div>

        {/* Ingredients */}
        <div className='mb-8'>
          <h3 className='text-xl font-bold text-navyBlue mb-2'>Ingredients</h3>
          <ScrollArea className='h-[150px] w-full rounded-md border p-2 mt-2'>
            {recipe.ingredients ? (
              recipe.ingredients.split(',').map((ingredient, index) => (
                <div
                  key={index}
                  className='flex justify-between items-center text-navyBlue'
                >
                  <span>
                    {index + 1}. {ingredient.trim()}
                  </span>
                </div>
              ))
            ) : (
              <p className='text-gray-500'>No ingredients provided</p>
            )}
          </ScrollArea>
        </div>

        {/* Steps */}
        <div className='mb-8'>
          <h3 className='text-xl font-bold text-navyBlue mb-2'>Steps</h3>
          <ScrollArea className='h-[150px] w-full rounded-md border p-2 mt-2'>
            {recipe.steps ? (
              recipe.steps.split(',').map((step, index) => (
                <div
                  key={index}
                  className='flex justify-between items-center text-navyBlue'
                >
                  <span>
                    {index + 1}. {step.trim()}
                  </span>
                </div>
              ))
            ) : (
              <p className='text-gray-500'>No steps provided</p>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
