'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FaTrashAlt } from 'react-icons/fa';
import Image from 'next/image';
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
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
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
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Please select a category.
                </p>
              )}
              {categoryError && (
                <p className='text-red-500 text-sm mt-2 flex items-center'>
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {categoryError}
                </p>
              )}
            </div>

            <div className='mb-6'>
              <label
                className='block text-gray-700 font-semibold mb-3'
                htmlFor='recipeImage'
              >
                Recipe Image
              </label>
              <div className='relative'>
                <input
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-orange-400 focus:outline-none transition-all duration-200 shadow-sm bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100'
                  id='recipeImage'
                  type='file'
                  accept='image/*'
                  {...register('recipeImage', { required: true })}
                  onChange={handleImageChange}
                />
                <div className='absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none'>
                  <svg
                    className='w-5 h-5 text-gray-400'
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
                </div>
              </div>
              {errors.recipeImage && (
                <p className='text-red-500 text-sm mt-2 flex items-center'>
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Recipe image is required.
                </p>
              )}
            </div>

            {imagePreview && (
              <div className='mb-6'>
                <div className='relative group h-64'>
                  <Image
                    src={imagePreview}
                    alt='Recipe Preview'
                    fill
                    sizes='(max-width: 768px) 100vw, 50vw'
                    className='object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105'
                  />
                  <div className='absolute top-4 right-4'>
                    <div className='bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
                      Preview
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className='flex items-center justify-center mt-8'>
              <button
                className={`${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform hover:scale-105'
                } text-white font-semibold py-3 px-8 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-200`}
                type='submit'
                disabled={loading}
              >
                {loading ? (
                  <span className='flex items-center'>
                    <svg
                      className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Creating Recipe...
                  </span>
                ) : (
                  'Create Recipe'
                )}
              </button>
            </div>

            {formError && (
              <div className='mt-6 p-4 bg-red-50 border border-red-200 rounded-xl'>
                <p className='text-red-600 text-sm flex items-center'>
                  <svg
                    className='w-5 h-5 mr-2'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {formError}
                </p>
              </div>
            )}
          </div>

          <div className='flex flex-col space-y-8'>
            <div>
              <h3 className='text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4'>
                Ingredients
              </h3>
              <div className='flex gap-3'>
                <input
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  className='flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-400 focus:outline-none transition-all duration-200 shadow-sm'
                  type='text'
                  placeholder='Enter an ingredient...'
                />
                <button
                  type='button'
                  onClick={addIngredient}
                  className='bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
                >
                  Add
                </button>
              </div>

              {ingredientError && (
                <p className='text-red-500 text-sm mt-2 flex items-center'>
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {ingredientError}
                </p>
              )}

              <div className='mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200'>
                <ScrollArea className='h-[150px] w-full'>
                  {ingredients.length > 0 ? (
                    <div className='space-y-2'>
                      {ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className='flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200'
                        >
                          <span className='text-gray-700'>
                            <span className='font-semibold text-green-600'>
                              {index + 1}.
                            </span>{' '}
                            {ingredient}
                          </span>
                          <button
                            onClick={() => deleteIngredient(index)}
                            className='text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all duration-200'
                          >
                            <FaTrashAlt className='w-4 h-4' />
                          </button>
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
                      <p className='text-gray-600'>No ingredients added yet</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <div>
              <h3 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4'>
                Cooking Steps
              </h3>
              <div className='flex gap-3'>
                <input
                  value={stepInput}
                  onChange={(e) => setStepInput(e.target.value)}
                  className='flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none transition-all duration-200 shadow-sm'
                  type='text'
                  placeholder='Describe the next step...'
                />
                <button
                  type='button'
                  onClick={addStep}
                  className='bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
                >
                  Add
                </button>
              </div>

              {stepError && (
                <p className='text-red-500 text-sm mt-2 flex items-center'>
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {stepError}
                </p>
              )}

              <div className='mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200'>
                <ScrollArea className='h-[150px] w-full'>
                  {steps.length > 0 ? (
                    <div className='space-y-2'>
                      {steps.map((step, index) => (
                        <div
                          key={index}
                          className='flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200'
                        >
                          <span className='text-gray-700'>
                            <span className='font-semibold text-blue-600'>
                              {index + 1}.
                            </span>{' '}
                            {step}
                          </span>
                          <button
                            onClick={() => deleteStep(index)}
                            className='text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all duration-200'
                          >
                            <FaTrashAlt className='w-4 h-4' />
                          </button>
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
                      <p className='text-gray-600'>No steps added yet</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </form>

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
            animation: fade-in-up 0.6s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
