import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUserData } from '../recipe/[id]/action';
import { useEffect, useState } from 'react';

export const Recipe = ({
  id,
  title,
  category,
  imageUrl,
  userId,
}: {
  id: string;
  title: string;
  category: string;
  userId: string;
  imageUrl?: string;
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = await getCurrentUserData();
      if (currentUser.success?.session?.user) {
        setCurrentUserId(currentUser.success.session.user.id);
      }
    };

    fetchUserData();
  }, []);
  return (
    <Link href={`/recipe/${id}`} key={id}>
      <div
        key={id}
        className='bg-gray-100 shadow-lg rounded-lg overflow-hidden border border-navyBlue'
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className='w-full h-48 object-cover'
          />
        ) : (
          <div className='w-full h-48 bg-gray-300 flex items-center justify-center text-gray-500'>
            No Image Available
          </div>
        )}
        <div className='p-4'>
          <h2 className='text-xl font-bold text-navyBlue mb-2'>{title}</h2>
          <p className='text-gray-600 italic'>{category}</p>
          <div>
            <button
              onClick={() => router.push(`/recipe/${id}`)}
              className='mt-4 bg-yellow text-white px-4 py-2 rounded hover:bg-yellow-600'
            >
              View Recipe
            </button>
            {currentUserId === userId && (
              <Link href={`/editRecipe/${id}`}>
                <button className='mt-4 bg-navyBlue text-white px-4 py-2 rounded hover:bg-navyBlue-600 ml-4'>
                  Edit Recipe
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
