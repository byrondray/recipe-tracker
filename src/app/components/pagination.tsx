'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }

    return pages;
  };

  return (
    <div className='flex items-center justify-center gap-2 mt-12'>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className='w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-md hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600'
        aria-label='Previous page'
      >
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
            d='M15 19l-7-7 7-7'
          />
        </svg>
      </button>

      {getPageNumbers().map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className='w-10 h-10 flex items-center justify-center text-gray-400'
          >
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-full font-medium shadow-md transition-all duration-200 ${
              page === currentPage
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-110'
                : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className='w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-md hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600'
        aria-label='Next page'
      >
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
            d='M9 5l7 7-7 7'
          />
        </svg>
      </button>
    </div>
  );
}
