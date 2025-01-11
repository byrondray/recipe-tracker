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
    <div className='flex justify-center py-12 min-h-screen bg-white'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-gray-100 shadow-md rounded-lg px-8 pt-6 pb-8 mb-4 w-full max-w-4xl border border-navyBlue grid grid-cols-2 gap-8'
      >
        <div>
          <h2 className='text-2xl font-bold text-navyBlue mb-6'>
            Create Recipe
          </h2>

          <div className='mb-4'>
            <label
              className='block text-night font-bold mb-2'
              htmlFor='recipeName'
            >
              Recipe Name
            </label>
            <input
              className='shadow appearance-none border rounded w-full py-2 px-3 text-navyBlue leading-tight focus:outline-none focus:shadow-outline border-navyBlue'
              id='recipeName'
              type='text'
              placeholder='Enter recipe name'
              {...register('recipeName', { required: true })}
            />
            {errors.recipeName && (
              <p className='text-red-500 text-xs italic'>
                Recipe name is required.
              </p>
            )}
          </div>

          <div className='mb-4'>
            <label
              className='block text-night font-bold mb-2'
              htmlFor='category'
            >
              Category
            </label>
            <div className='relative'>
              <select
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-navyBlue leading-tight focus:outline-none focus:shadow-outline border-navyBlue bg-white pr-8 ${
                  categoryError ? 'border-red-500' : ''
                }`}
                id='category'
                {...register('categoryId', { required: true })}
              >
                <option value='' disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-navyBlue'>
                <svg
                  className='fill-current h-4 w-4'
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 20 20'
                >
                  <path d='M7 7l3-3 3 3h-6z' />
                </svg>
              </div>
            </div>

            {errors.categoryId && (
              <p className='text-red-500 text-xs italic'>
                Please select a category.
              </p>
            )}
            {categoryError && (
              <p className='text-red-500 text-xs italic'>{categoryError}</p>
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
