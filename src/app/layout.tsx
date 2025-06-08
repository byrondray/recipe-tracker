import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/navbar';
import { auth } from '@/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CookBook+',
  description: 'A cookbook to find new recipes and keep track of your own',
};

export interface CustomSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  sessionToken: string;
  userId: string;
  expires: string;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang='en'>
      <body className={inter.className}>
        <Navbar session={session!} />
        {children}
      </body>
    </html>
  );
}
