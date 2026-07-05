'use client';

import { useEffect, useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import Image from 'next/image';
import { StarRating } from './starRating';
import { DeleteConfirmModal } from './deleteConfirmModal';
import {
  getReviewsForRecipe,
  getCurrentUserReview,
  createReview,
  updateReview,
  deleteReview,
} from '@/app/reviews/action';
import { Review } from '@/db/schema/schema';

interface ReviewWithUser {
  review: Review;
  user: { id: string; name: string | null; image: string | null };
}

interface ReviewSectionProps {
  recipeId: string;
  currentUserId: string | null;
}

export function ReviewSection({ recipeId, currentUserId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = async () => {
    const result = await getReviewsForRecipe(recipeId);
    if (result.success) {
      setReviews(result.success.reviews as ReviewWithUser[]);
      setAverage(result.success.average);
      setCount(result.success.count);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadReviews();
      if (currentUserId) {
        const mine = await getCurrentUserReview(recipeId);
        if (mine.success) {
          setMyReview(mine.success.review);
        }
      }
      setLoading(false);
    };
    load();
  }, [recipeId, currentUserId]);

  const startEditing = () => {
    setFormRating(myReview?.rating ?? 0);
    setFormComment(myReview?.comment ?? '');
    setFormError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (formRating < 1) {
      setFormError('Please select a rating');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const result = myReview
      ? await updateReview(myReview.id, formRating, formComment)
      : await createReview(recipeId, formRating, formComment);

    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setEditing(false);
    await loadReviews();
    const mine = await getCurrentUserReview(recipeId);
    if (mine.success) {
      setMyReview(mine.success.review);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    setDeleting(true);
    const result = await deleteReview(myReview.id);
    setDeleting(false);
    setShowDeleteModal(false);

    if (result.success) {
      setMyReview(null);
      await loadReviews();
    }
  };

  return (
    <div className='mt-12 pt-12 border-t border-gray-100'>
      <div className='flex flex-col sm:flex-row sm:items-center gap-4 mb-8'>
        <h3 className='text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'>
          Reviews
        </h3>
        {count > 0 && (
          <div className='flex items-center gap-2'>
            <StarRating value={average} readOnly size='sm' />
            <span className='text-gray-600 font-medium'>
              {average.toFixed(1)} ({count} review{count === 1 ? '' : 's'})
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className='space-y-4'>
          {[1, 2].map((i) => (
            <div key={i} className='animate-pulse bg-gray-100 rounded-2xl h-24' />
          ))}
        </div>
      ) : (
        <>
          {currentUserId && (
            <div className='mb-8'>
              {!editing ? (
                myReview ? (
                  <div className='flex flex-wrap gap-3'>
                    <button
                      type='button'
                      onClick={startEditing}
                      className='bg-orange-100 text-orange-700 px-5 py-2.5 rounded-full font-medium hover:bg-orange-200 transition-all duration-200'
                    >
                      Edit your review
                    </button>
                    <button
                      type='button'
                      onClick={() => setShowDeleteModal(true)}
                      className='flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-full font-medium hover:bg-red-100 transition-all duration-200'
                    >
                      <FaTrashAlt className='w-3.5 h-3.5' />
                      Delete
                    </button>
                  </div>
                ) : (
                  <button
                    type='button'
                    onClick={startEditing}
                    className='bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                  >
                    Write a review
                  </button>
                )
              ) : (
                <div className='bg-orange-50 rounded-2xl p-6 space-y-4'>
                  <StarRating value={formRating} onChange={setFormRating} size='lg' />
                  <textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder='Share your thoughts about this recipe (optional)'
                    rows={3}
                    className='w-full rounded-xl border border-gray-200 p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none'
                  />
                  {formError && (
                    <p className='text-red-600 text-sm font-medium'>{formError}</p>
                  )}
                  <div className='flex gap-3'>
                    <button
                      type='button'
                      onClick={handleSubmit}
                      disabled={submitting}
                      className='bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50'
                    >
                      {submitting ? 'Saving...' : myReview ? 'Update review' : 'Submit review'}
                    </button>
                    <button
                      type='button'
                      onClick={cancelEditing}
                      disabled={submitting}
                      className='bg-gray-100 text-gray-700 px-6 py-2.5 rounded-full font-medium hover:bg-gray-200 transition-all duration-200 disabled:opacity-50'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {reviews.length === 0 ? (
            <p className='text-gray-500 text-center py-8'>
              No reviews yet. Be the first to share your thoughts!
            </p>
          ) : (
            <div className='space-y-6'>
              {reviews.map(({ review, user }) => (
                <div
                  key={review.id}
                  className='flex gap-4 pb-6 border-b border-gray-100 last:border-b-0'
                >
                  <div className='w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center shrink-0'>
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ?? 'User'}
                        width={40}
                        height={40}
                        className='object-cover w-full h-full'
                      />
                    ) : (
                      <span className='text-orange-600 font-semibold'>
                        {(user.name ?? '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 flex-wrap'>
                      <span className='font-semibold text-gray-800'>
                        {user.name ?? 'Anonymous'}
                      </span>
                      <StarRating value={review.rating} readOnly size='sm' />
                    </div>
                    {review.comment && (
                      <p className='text-gray-600 mt-2 leading-relaxed'>
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <DeleteConfirmModal
        open={showDeleteModal}
        title='Delete your review?'
        description='This will permanently remove your review. This action cannot be undone.'
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
