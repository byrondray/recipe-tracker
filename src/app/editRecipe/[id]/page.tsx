'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { FaTrashAlt } from 'react-icons/fa';
import { useRouter, useParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  updateRecipe,
  deleteMedia,
  getSignedUrlForExistingFile,
} from './action';
import { getCategories, generateFileName } from '@/app/createRecipe/actions';
import { getRecipe } from '@/app/recipe/[id]/action';
import { getCurrentUserData } from '@/app/recipe/[id]/action';
import { Spinner } from '@/components/ui/spinner';

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

export default function EditRecipeForm() {
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
  const [pageLoading, setPageLoading] = useState(true); 
  const [formError, setFormError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [imageDeleted, setImageDeleted] = useState<boolean>(false);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(
    null
  );

  const params = useParams();
  const router = useRouter();
  
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;

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
        setFormError('Something went wrong while fetching categories.');
      }
    };

    const fetchRecipeData = async () => {
      try {
        const result = await getRecipe(recipeId);
        if (result.success) {
          const { recipe, category, imageUrl } = result.success.recipe[0];
          const currentUser = await getCurrentUserData();
          const recipeOwner = recipe.userId;

          if (currentUser.success?.session?.user?.id !== recipeOwner) {
            router.push(`/recipe/${recipeId}`);
          }

          const generatedFileName = await generateFileName();
          setGeneratedFileName(generatedFileName);
          setValue('recipeName', recipe.title);
          setValue('categoryId', recipe.category);
          setIngredients(
            recipe.ingredients.split(',').map((item) => item.trim())
          );
          setFileName(recipe.media);
          setSteps((recipe.steps ?? '').split(',').map((item) => item.trim()));
          setImagePreview(imageUrl);
          setImageDeleted(false);
        } else {
          setFormError('Failed to load recipe.');
        }
      } catch (error) {
        setFormError('Something went wrong while loading the recipe.');
      } finally {
        setPageLoading(false); 
      }
    };

    fetchCategories();
    fetchRecipeData();
  }, [recipeId, setValue]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setFormError(null);
    setLoading(true);

    if (!data.categoryId) {
      setCategoryError('Please select a category.');
      setLoading(false);
      return;
    }

    const finalFileName = fileName ?? generatedFileName;

    try {
      let mediaUrl = imagePreview;
      let mimeTypeToSend = mimeType;
      let file = newFile; 

      if (imageDeleted) {
        mediaUrl = null;
        mimeTypeToSend = null;
        file = null;
      }

    
      const acceptedImageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (file && !acceptedImageTypes.includes(file.type)) {
        setFormError('You can only upload images.');
        setLoading(false);
        return;
      }

      if (file) {
        mimeTypeToSend = file.type;

        const signedUrl = await getSignedUrlForExistingFile(
          file.type,
          file.size,
          finalFileName 
        );

        if (signedUrl.error) {
          setFormError(signedUrl.error);
          setLoading(false);
          return;
        }

        const uploadUrl = signedUrl.success?.url;
        if (uploadUrl) {
          console.log('Uploading file:', file);
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image to AWS.');
          }

          mediaUrl = `${process.env.NEXT_PUBLIC_AWS_BUCKET_URL}/${signedUrl.success?.fileName}`;
          console.log('Image successfully uploaded:', mediaUrl);

          setImageDeleted(false);
        } else {
          throw new Error('Signed URL is undefined');
        }
      }

      const result = await updateRecipe(
        recipeId,
        data.recipeName,
        steps.join(', '),
        ingredients.join(', '),
        data.categoryId,
        finalFileName, 
        mimeTypeToSend
      );

      if (result.success) {
        router.push(`/recipe/${recipeId}`);
      } else {
        setFormError('Failed to update recipe.');
      }
    } catch (error) {
      console.error('Something went wrong while updating the recipe:', error);
      setFormError('Something went wrong while updating the recipe.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('file', file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setMimeType(file.type);
      setFileSize(file.size);
      setImageDeleted(false);
      setNewFile(file);
    } else {
      setImagePreview(null);
      setMimeType(null);
      setFileSize(null);
    }
  };

  const deleteCurrentImage = async () => {
    if (imagePreview) {
      const imageId = imagePreview.split('/').pop();
      if (imageId) {
        const result = await deleteMedia(imageId);
        if (result.success) {
          setImageDeleted(true);
          setMimeType(null);
        } else {
          setFormError(result.error || 'Failed to delete image.');
        }
      }
      setImagePreview(null);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const addStep = () => {
    if (stepInput.trim()) {
      setSteps([...steps, stepInput.trim()]);
      setStepInput('');
    }
  };

  const deleteIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const deleteStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  if (pageLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Spinner />
      </div>
    );
  }

  return (
    <div className='flex justify-center py-12 min-h-screen bg-white relative'>
      {loading && (
        <div className='absolute inset-0 z-50 flex justify-center items-center bg-white/80'>
          <Spinner />
        </div>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-gray-100 shadow-md rounded-lg px-8 pt-6 pb-8 mb-4 w-full max-w-4xl border border-navyBlue grid grid-cols-2 gap-8'
      >
        <div>
          <h2 className='text-2xl font-bold text-navyBlue mb-6'>Edit Recipe</h2>

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
                  <path d='M7 7l3-3 3 3H7z' />
                </svg>
              </div>
            </div>
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
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className='relative mb-4'>
                <img
                  src={imagePreview}
                  alt='Recipe Preview'
                  className='w-full h-auto rounded-md'
                />
                <button
                  type='button'
                  onClick={deleteCurrentImage}
                  className='absolute top-2 right-2 text-red-500'
                >
                  <FaTrashAlt className='w-6 h-6' />
                </button>
              </div>
            )}
          </div>

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
              {loading ? 'Submitting...' : 'Update Recipe'}
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
