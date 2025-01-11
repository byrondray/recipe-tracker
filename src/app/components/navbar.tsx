'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import { type Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { getCurrentUserData } from '../recipe/[id]/action';

export default function Navbar({ session }: { session: Session | null }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = await getCurrentUserData();
      if (currentUser.success?.session?.user) {
        setCurrentUserId(currentUser.success.session.user.id);
      }
    };

    fetch;
  }, []);
  return (
    <nav className='bg-navyBlue p-4 shadow-lg flex justify-between items-center text-antiWhite'>
      <NavigationMenu>
        <NavigationMenuItem>
          <NavigationMenuTrigger className='text-lg font-bold text-navyBlue hover:text-navyBlue hover:bg-antiWhite bg-antiWhite !important'>
            Recipe Options
          </NavigationMenuTrigger>
          <NavigationMenuContent className='p-2 bg-antiWhite rounded-md shadow-md min-w-[200px]'>
            <NavigationMenuLink asChild>
              <Link href='/' className='block mb-2 pb-2 border-b border-black'>
                Explore Recipes
              </Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link
                href='/createRecipe'
                className='block mb-2 pb-2 border-b border-black'
              >
                Create Recipe
              </Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link href={`/userProfile/${currentUserId}`} className='block'>
                View Your Recipes
              </Link>
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenu>

      {session ? (
        <div className='flex items-center space-x-3'>
          <img
            src={session.user?.image || '/default-avatar.png'}
            alt='User Avatar'
            className='w-10 h-10 rounded-full'
          />
          <span className='font-semibold'>Welcome, {session.user?.name}!</span>
          <button
            onClick={() => signOut()}
            className='text-red-500 hover:text-red-600 ml-4 cursor-pointer'
          >
            Sign out
          </button>
        </div>
      ) : (
        <Link href='/api/auth/signin' className='text-lg font-bold '>
          Sign in
        </Link>
      )}
    </nav>
  );
}
