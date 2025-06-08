'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { type Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { getCurrentUserData } from '../recipe/[id]/action';

export default function Navbar({ session }: { session: Session | null }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = await getCurrentUserData();
      if (currentUser.success?.session?.user) {
        setCurrentUserId(currentUser.success.session.user.id);
      }
    };

    fetchUserData();
  }, []);

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className='bg-white shadow-xl sticky top-0 z-50'>
      <div className='container mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo/Brand */}
          <div className='flex items-center space-x-4'>
            <Link href='/' className='flex items-center space-x-2 group'>
              <div className='w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center transform transition-transform group-hover:rotate-12'>
                <svg
                  className='w-6 h-6 text-white'
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
              </div>
              <span className='text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'>
                Recipe Hub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center'>
              <div className='relative'>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className='flex items-center space-x-1 px-4 py-2 rounded-full hover:bg-orange-50 transition-all duration-200 text-gray-700 hover:text-orange-600'
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
                      d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                    />
                  </svg>
                  <span className='font-medium'>Recipe Options</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isMenuOpen ? 'rotate-180' : ''
                    }`}
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
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className='absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl overflow-hidden transform origin-top animate-menu-slide-down'>
                    <Link
                      href='/'
                      onClick={closeMenus}
                      className='flex items-center space-x-3 px-5 py-3 hover:bg-orange-50 transition-colors duration-200 group'
                    >
                      <div className='w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors'>
                        <svg
                          className='w-5 h-5 text-orange-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='font-semibold text-gray-800'>
                          Explore Recipes
                        </p>
                        <p className='text-sm text-gray-600'>
                          Browse all recipes
                        </p>
                      </div>
                    </Link>

                    <Link
                      href='/createRecipe'
                      onClick={closeMenus}
                      className='flex items-center space-x-3 px-5 py-3 hover:bg-orange-50 transition-colors duration-200 group border-t border-gray-100'
                    >
                      <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors'>
                        <svg
                          className='w-5 h-5 text-green-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M12 4v16m8-8H4'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='font-semibold text-gray-800'>
                          Create Recipe
                        </p>
                        <p className='text-sm text-gray-600'>
                          Share your creation
                        </p>
                      </div>
                    </Link>

                    <Link
                      href={`/userProfile/${currentUserId}`}
                      onClick={closeMenus}
                      className='flex items-center space-x-3 px-5 py-3 hover:bg-orange-50 transition-colors duration-200 group border-t border-gray-100'
                    >
                      <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors'>
                        <svg
                          className='w-5 h-5 text-purple-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='font-semibold text-gray-800'>
                          Your Recipes
                        </p>
                        <p className='text-sm text-gray-600'>
                          View your collection
                        </p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Section */}
          <div className='flex items-center space-x-4'>
            {session ? (
              <div className='flex items-center space-x-4'>
                <div className='hidden md:flex items-center space-x-3'>
                  <div className='text-right'>
                    <p className='text-sm font-medium text-gray-700'>
                      Welcome back,
                    </p>
                    <p className='text-sm font-bold text-orange-600'>
                      {session.user?.name}
                    </p>
                  </div>
                  <Image
                    src={session.user?.image || '/default-avatar.png'}
                    alt='User Avatar'
                    width={40}
                    height={40}
                    className='w-10 h-10 rounded-full border-2 border-orange-400 shadow-md'
                  />
                </div>
                <button
                  onClick={() => signOut()}
                  className='hidden md:flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full font-medium hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                    />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                href='/api/auth/signin'
                className='hidden md:flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                  />
                </svg>
                <span>Sign in</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='md:hidden p-2 rounded-lg hover:bg-orange-50 transition-colors'
            >
              <svg
                className='w-6 h-6 text-gray-700'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M6 18L18 6M6 6l12 12'
                  />
                ) : (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className='md:hidden bg-white border-t border-gray-100 animate-menu-slide-down'>
          <div className='px-4 py-3 space-y-3'>
            <Link
              href='/'
              onClick={closeMenus}
              className='flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50 transition-colors'
            >
              <svg
                className='w-5 h-5 text-orange-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              <span className='font-medium text-gray-800'>Explore Recipes</span>
            </Link>

            <Link
              href='/createRecipe'
              onClick={closeMenus}
              className='flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50 transition-colors'
            >
              <svg
                className='w-5 h-5 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 4v16m8-8H4'
                />
              </svg>
              <span className='font-medium text-gray-800'>Create Recipe</span>
            </Link>

            <Link
              href={`/userProfile/${currentUserId}`}
              onClick={closeMenus}
              className='flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50 transition-colors'
            >
              <svg
                className='w-5 h-5 text-purple-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
              <span className='font-medium text-gray-800'>Your Recipes</span>
            </Link>

            <div className='border-t border-gray-100 pt-3'>
              {session ? (
                <div className='space-y-3'>
                  <div className='flex items-center space-x-3 px-3'>
                    <Image
                      src={session.user?.image || '/default-avatar.png'}
                      alt='User Avatar'
                      width={32}
                      height={32}
                      className='w-8 h-8 rounded-full border-2 border-orange-400'
                    />
                    <span className='font-medium text-gray-800'>
                      {session.user?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className='w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full font-medium'
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                      />
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href='/api/auth/signin'
                  className='w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-medium'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                    />
                  </svg>
                  <span>Sign in</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes menu-slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-menu-slide-down {
          animation: menu-slide-down 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
}
