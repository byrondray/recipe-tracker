export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 rounded-lg ${className}`}
    />
  );
}

function HeroSkeleton() {
  return (
    <div className='relative overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 text-white'>
      <div className='absolute inset-0 bg-black opacity-10'></div>
      <div className='relative container mx-auto px-4 py-16 text-center'>
        <div className='h-10 md:h-16 w-3/4 md:w-1/2 bg-white/30 rounded-xl mx-auto mb-4 animate-pulse'></div>
        <div className='h-6 w-1/2 md:w-1/3 bg-white/20 rounded-lg mx-auto animate-pulse'></div>
      </div>
      <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-50 to-transparent'></div>
    </div>
  );
}

function RecipeCardSkeleton() {
  return (
    <div className='bg-white rounded-2xl shadow-lg overflow-hidden'>
      <SkeletonBlock className='h-56 sm:h-64 w-full rounded-none' />
      <div className='p-5'>
        <SkeletonBlock className='h-6 w-3/4 mb-4' />
        <div className='flex gap-3'>
          <SkeletonBlock className='h-10 flex-1 rounded-full' />
          <SkeletonBlock className='h-10 w-20 rounded-full' />
        </div>
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50'>
      <HeroSkeleton />

      <div className='container mx-auto px-4 -mt-8 relative z-10'>
        <div className='bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-3xl mx-auto'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <SkeletonBlock className='h-14 flex-1 rounded-full' />
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8'>
          {Array.from({ length: 16 }).map((_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function UserProfilePageSkeleton() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50'>
      <HeroSkeleton />

      <div className='container mx-auto px-4 -mt-8 relative z-10 pb-12'>
        <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto mb-12'>
          <div className='flex flex-col md:flex-row items-center gap-8'>
            <SkeletonBlock className='w-32 h-32 rounded-full flex-shrink-0' />
            <div className='flex-1 w-full text-center md:text-left'>
              <SkeletonBlock className='h-8 w-1/2 mx-auto md:mx-0 mb-4' />
              <SkeletonBlock className='h-4 w-2/3 mx-auto md:mx-0 mb-2' />
              <SkeletonBlock className='h-4 w-1/3 mx-auto md:mx-0' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-7xl mx-auto'>
          <div className='text-center mb-8'>
            <SkeletonBlock className='h-10 w-64 mx-auto mb-4' />
            <SkeletonBlock className='h-4 w-80 mx-auto' />
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8'>
            {Array.from({ length: 8 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecipeDetailPageSkeleton() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50'>
      <div className='relative overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 text-white'>
        <div className='absolute inset-0 bg-black opacity-10'></div>
        <div className='relative container mx-auto px-4 py-16'>
          <div className='max-w-4xl mx-auto'>
            <div className='flex flex-col md:flex-row items-start gap-6'>
              <div className='flex-1'>
                <div className='h-10 md:h-12 w-3/4 bg-white/30 rounded-xl mb-4 animate-pulse'></div>
                <div className='h-8 w-32 bg-white/20 rounded-full animate-pulse'></div>
              </div>
              <div className='flex gap-3'>
                <div className='h-12 w-36 bg-white/20 rounded-full animate-pulse'></div>
                <div className='h-12 w-36 bg-white/20 rounded-full animate-pulse'></div>
              </div>
            </div>
          </div>
        </div>
        <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-50 to-transparent'></div>
      </div>

      <div className='container mx-auto px-4 -mt-8 relative z-10 pb-12'>
        <div className='bg-white rounded-2xl shadow-2xl max-w-6xl mx-auto overflow-hidden'>
          <SkeletonBlock className='h-96 w-full rounded-none' />

          <div className='p-8 lg:p-12'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
              {Array.from({ length: 2 }).map((_, col) => (
                <div key={col}>
                  <SkeletonBlock className='h-8 w-40 mb-6' />
                  <div className='bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-3'>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonBlock key={i} className='h-12 w-full' />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormFieldSkeleton() {
  return (
    <div className='mb-6'>
      <SkeletonBlock className='h-5 w-32 mb-3' />
      <SkeletonBlock className='h-12 w-full' />
    </div>
  );
}

export function RecipeFormPageSkeleton() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50'>
      <HeroSkeleton />

      <div className='container mx-auto px-4 -mt-8 relative z-10 pb-12'>
        <div className='bg-white rounded-2xl shadow-2xl px-8 pt-8 pb-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8'>
          <div>
            <SkeletonBlock className='h-8 w-48 mb-8' />
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <SkeletonBlock className='h-64 w-full mb-6' />
            <div className='flex items-center justify-center mt-8'>
              <SkeletonBlock className='h-12 w-40 rounded-full' />
            </div>
          </div>

          <div className='flex flex-col space-y-8'>
            <div>
              <SkeletonBlock className='h-7 w-36 mb-4' />
              <div className='flex gap-3 mb-4'>
                <SkeletonBlock className='h-12 flex-1' />
                <SkeletonBlock className='h-12 w-20' />
              </div>
              <SkeletonBlock className='h-36 w-full' />
            </div>
            <div>
              <SkeletonBlock className='h-7 w-36 mb-4' />
              <div className='flex gap-3 mb-4'>
                <SkeletonBlock className='h-12 flex-1' />
                <SkeletonBlock className='h-12 w-20' />
              </div>
              <SkeletonBlock className='h-36 w-full' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
