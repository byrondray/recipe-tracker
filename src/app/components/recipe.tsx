import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { deleteRecipe } from '../recipe/[id]/action';
import { useEffect, useState } from 'react';
import { FaTrashAlt, FaHeart, FaRegHeart } from 'react-icons/fa';
import { DeleteConfirmModal } from './deleteConfirmModal';
import {
  isRecipeFavourited,
  toggleFavourite,
} from '../favourites/action';

export const Recipe = ({
  id,
  title,
  category,
  imageUrl,
  userId,
  currentUserId = null,
  onDeleted,
  showDeleteButton = false,
  onUnfavourited,
}: {
  id: string;
  title: string;
  category: string;
  userId: string;
  imageUrl?: string;
  currentUserId?: string | null;
  onDeleted?: (id: string) => void;
  showDeleteButton?: boolean;
  onUnfavourited?: (id: string) => void;
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [favourited, setFavourited] = useState(false);
  const [togglingFavourite, setTogglingFavourite] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    isRecipeFavourited(id).then((result) => {
      if (!cancelled && result.success) {
        setFavourited(result.success.favourited);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id, currentUserId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/recipe/${id}`);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/recipe/${id}`);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/editRecipe/${id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleFavouriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId || togglingFavourite) return;

    setTogglingFavourite(true);
    const previous = favourited;
    setFavourited(!previous);

    const result = await toggleFavourite(id);
    setTogglingFavourite(false);

    if (!result.success) {
      setFavourited(previous);
      return;
    }

    if (!result.success.favourited) {
      onUnfavourited?.(id);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    const result = await deleteRecipe(id);
    setDeleting(false);
    setShowDeleteModal(false);

    if (result.success) {
      onDeleted?.(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleCardKeyDown}
      role='link'
      tabIndex={0}
      aria-label={`View recipe: ${title}`}
      className='group relative bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300'
    >
      {/* Image Container */}
      <div className='relative h-56 sm:h-64 overflow-hidden bg-gray-100'>
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent'></div>
              </div>
            )}
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
              className={`object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          </>
        ) : (
          <div className='w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center'>
            <svg
              className='w-16 h-16 text-orange-300'
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
        )}

        {/* Category Badge */}
        <div className='absolute top-4 left-4'>
          <span className='bg-white/90 backdrop-blur-sm text-orange-600 px-3 py-1 rounded-full text-sm font-medium shadow-md'>
            {category}
          </span>
        </div>

        {/* Favourite Button */}
        {currentUserId && (
          <button
            onClick={handleFavouriteClick}
            disabled={togglingFavourite}
            aria-label={
              favourited ? 'Remove from favourites' : 'Add to favourites'
            }
            aria-pressed={favourited}
            className='absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all duration-200 disabled:opacity-50'
          >
            {favourited ? (
              <FaHeart className='w-4 h-4 text-red-500' />
            ) : (
              <FaRegHeart className='w-4 h-4 text-gray-500' />
            )}
          </button>
        )}

        {/* Gradient Overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'></div>
      </div>

      {/* Content */}
      <div className='p-5'>
        <h3 className='text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors duration-200'>
          {title}
        </h3>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-3'>
          <button
            onClick={handleClick}
            className='flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg'
          >
            View Recipe
          </button>

          {currentUserId === userId && (
            <button
              onClick={handleEditClick}
              className='bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg'
            >
              <svg
                className='w-5 h-5 inline-block mr-1'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              </svg>
              Edit
            </button>
          )}

          {showDeleteButton && currentUserId === userId && (
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className='bg-red-100 text-red-700 px-4 py-2 rounded-full font-medium hover:bg-red-200 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50'
            >
              <FaTrashAlt className='w-4 h-4 inline-block mr-1' />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className='absolute inset-0 border-2 border-orange-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'></div>

      <DeleteConfirmModal
        open={showDeleteModal}
        title={`Delete "${title}"?`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
