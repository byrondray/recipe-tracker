'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FaTrashAlt } from 'react-icons/fa';
import {
  getSignedUrl,
  createRecipe,
  createMedia,
  getCategories,
} from './actions';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface FormData {
  recipeName: string;
  recipeImage: FileList;
  recipeDescription: string;
  categoryId: string;
}

export default function CreateRecipeForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [stepInput, setStepInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [ingredientError, setIngredientError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getCategories();
        if (result.success?.categories) {
          setCategories(result.success.categories);
        } else {
          setFormError(result.error || 'Failed to fetch categories.');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setFormError('Something went wrong while fetching categories.');
      }
    };
    fetchCategories();
  }, []);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setFormError(null);
    setLoading(true);

    if (!data.categoryId) {
      setCategoryError('Please select a category.');
      setLoading(false);
      return;
    } else {
      setCategoryError(null);
    }

    try {
      const signedUrl = await getSignedUrl(
        data.recipeImage[0].type,
        data.recipeImage[0].size
      );

      if (signedUrl.error) {
        setFormError(signedUrl.error);
        setLoading(false);
        return;
      }

      const url = signedUrl.success?.url;

      if (url) {
        await fetch(url, {
          method: 'PUT',
          body: data.recipeImage[0],
          headers: {
            'Content-Type': data.recipeImage[0].type,
          },
        });
      } else {
        throw new Error('Failed to get signed URL.');
      }

      const urlAWS = `${process.env.NEXT_PUBLIC_AWS_BUCKET_URL}/${signedUrl.success?.fileName}`;

      const media = {
        id: signedUrl.success?.fileName ?? '',
        url: urlAWS,
        type: data.recipeImage[0].type,
        createdAt: new Date(),
      };

      const mediaResults = await createMedia(media);

      const recipe = {
        id: signedUrl.success?.fileName ?? '',
        title: data.recipeName,
        description: data.recipeDescription,
        media: mediaResults.success?.media[0].id ?? '',
        category: data.categoryId,
        userId: '',
        ingredients: ingredients.join(', '),
        steps: steps.join(', '),
      };

      const result = await createRecipe(recipe);
      if (result.error) {
        setFormError(result.error);
        setLoading(false);
        return;
      }

      if (result.success) {
        router.push(`/recipe/${result.success.recipe[0].id}`);
      } else {
        setFormError('Failed to create recipe.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormError('Something went wrong while submitting the form.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setIngredientError(null);
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    } else {
      setIngredientError('Ingredient input cannot be empty.');
    }
  };

  const addStep = () => {
    if (stepInput.trim()) {
      setStepError(null);
      setSteps([...steps, stepInput.trim()]);
      setStepInput('');
    } else {
      setStepError('Step input cannot be empty.');
    }
  };

  const deleteIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const deleteStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50'>
      {/* Hero Section */}
      <div className='relative overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 text-white'>
        <div className='absolute inset-0 bg-black opacity-10'></div>
        <div className='relative container mx-auto px-4 py-16 text-center'>
          <h1 className='text-4xl md:text-6xl font-bold mb-4 animate-fade-in-down'>
            Create New Recipe
          </h1>
          <p className='text-lg md:text-xl opacity-90 animate-fade-in-up'>
            Share your culinary masterpiece with the world
          </p>
        </div>
        <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-50 to-transparent'></div>
      </div>

      <div className='container mx-auto px-4 -mt-8 relative z-10 pb-12'>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='bg-white rounded-2xl shadow-2xl px-8 pt-8 pb-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 transform transition-all duration-300 hover:shadow-3xl'
        >
        <div>
          <h2 className='text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-8'>
            Recipe Details
          </h2>

          <div className='mb-6'>
            <label
              className='block text-gray-700 font-semibold mb-3'
              htmlFor='recipeName'
            >
              Recipe Name
            </label>
            <input
              className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:outline-none transition-all duration-200 shadow-sm'
              id='recipeName'
              type='text'
              placeholder='Enter your recipe name...'
              {...register('recipeName', { required: true })}
            />
            {errors.recipeName && (
              <p className='text-red-500 text-sm mt-2 flex items-center'>
                <svg className='w-4 h-4 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                </svg>
                Recipe name is required.
              </p>
            )}
          </div>

          <div className='mb-6'>
            <label
              className='block text-gray-700 font-semibold mb-3'
              htmlFor='category'
            >
              Category
            </label>
            <div className='relative'>
              <select
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-orange-400 focus:outline-none transition-all duration-200 shadow-sm appearance-none bg-white pr-10 ${
                  categoryError ? 'border-red-400' : ''
                }`}
                id='category'
                {...register('categoryId', { required: true })}
              >
                <option value='' disabled>
                  Choose a category...
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400'>
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
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>

            {errors.categoryId && (
              <p className='text-red-500 text-sm mt-2 flex items-center'>
                <svg className='w-4 h-4 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                </svg>
                Please select a category.
              </p>
            )}
            {categoryError && (
              <p className='text-red-500 text-sm mt-2 flex items-center'>
                <svg className='w-4 h-4 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                </svg>
                {categoryError}
              </p>
            )}
          </div>

          <div className='mb-4'>
            <label
              className='block text-night font-bold mb-2'
              htmlFor='recipeImage'
            >
              Recipe Image
            </label>
            <input
              className='shadow appearance-none rounded w-full py-2 px-3 text-navyBlue leading-tight focus:outline-none focus:shadow-outline border border-navyBlue bg-white'
              id='recipeImage'
              type='file'
              accept='image/*'
              {...register('recipeImage', { required: true })}
              onChange={handleImageChange}
            />
            {errors.recipeImage && (
              <p className='text-red-500 text-xs italic'>
                Recipe image is required.
              </p>
            )}
          </div>

          {imagePreview && (
            <div className='mb-4'>
              <img
                src={imagePreview}
                alt='Recipe Preview'
                className='w-full h-auto rounded-md'
              />
            </div>
          )}

          <div className='flex items-center justify-between'>
            <button
              className={`${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-yellow hover:cursor-pointer'
              } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline border border-navyBlue hover:border-navyBlue`}
              type='submit'
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Create Recipe'}
            </button>
          </div>

          {formError && (
            <p className='text-red-500 text-xs italic mt-4'>{formError}</p>
          )}
        </div>

        <div className='flex flex-col space-y-8'>
          <div>
            <h3 className='text-xl font-bold text-navyBlue mb-2'>
              Ingredients
            </h3>
            <input
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              className='shadow appearance-none border rounded w-full py-2 px-3 text-navyBlue leading-tight focus:outline-none focus:shadow-outline border-navyBlue'
              type='text'
              placeholder='Enter an ingredient'
            />
            <button
              type='button'
              onClick={addIngredient}
              className='bg-yellow text-white px-4 py-2 mt-2 rounded hover:cursor-pointer border-navyBlue border'
            >
              Add Ingredient
            </button>

            {ingredientError && (
              <p className='text-red-500 text-xs italic mt-2'>
                {ingredientError}
              </p>
            )}

            <ScrollArea className='h-[150px] w-full rounded-md border p-2 mt-2'>
              {ingredients.length > 0 ? (
                ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center text-navyBlue'
                  >
                    <span>
                      {index + 1}. {ingredient}
                    </span>
                    <button onClick={() => deleteIngredient(index)}>
                      <FaTrashAlt className='text-red-500 hover:text-red-600' />
                    </button>
                  </div>
                ))
              ) : (
                <p className='text-gray-500'>No ingredients added</p>
              )}
            </ScrollArea>
          </div>

          <div>
            <h3 className='text-xl font-bold text-navyBlue mb-2'>Steps</h3>
            <input
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              className='shadow appearance-none border rounded w-full py-2 px-3 text-navyBlue leading-tight focus:outline-none focus:shadow-outline border-navyBlue'
              type='text'
              placeholder='Enter a step'
            />
            <button
              type='button'
              onClick={addStep}
              className='bg-yellow text-white px-4 py-2 mt-2 rounded hover:cursor-pointer border border-navyBlue'
            >
              Add Step
            </button>

            {stepError && (
              <p className='text-red-500 text-xs italic mt-2'>{stepError}</p>
            )}

            <ScrollArea className='h-[150px] w-full rounded-md border p-2 mt-2'>
              {steps.length > 0 ? (
                steps.map((step, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center text-navyBlue'
                  >
                    <span>
                      {index + 1}. {step}
                    </span>
                    <button onClick={() => deleteStep(index)}>
                      <FaTrashAlt className='text-red-500 hover:text-red-600' />
                    </button>
                  </div>
                ))
              ) : (
                <p className='text-gray-500'>No steps added</p>
              )}
            </ScrollArea>
          </div>
        </div>
      </form>
    </div>
  );
}
