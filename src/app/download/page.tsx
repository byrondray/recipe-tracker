'use client';

import { useEffect, useState } from 'react';
import { usePageTitle } from '@/app/components/usePageTitle';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallState =
  | 'checking'
  | 'installable'
  | 'installed'
  | 'unsupported'
  | 'installing';

type Platform = 'android' | 'ios' | 'other';

function detectPlatform(): Platform {
  const ua = window.navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  // iPadOS 13+ reports as Mac with touch support
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  return 'other';
}

export default function DownloadPage() {
  usePageTitle('Get the App');

  const [installState, setInstallState] = useState<InstallState>('checking');
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstallState('installed');
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState('installable');
    };

    const handleAppInstalled = () => {
      setInstallState('installed');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const timeout = setTimeout(() => {
      setInstallState((current) =>
        current === 'checking' ? 'unsupported' : current
      );
    }, 1500);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timeout);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setInstallState('installing');
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallState(choice.outcome === 'accepted' ? 'installed' : 'installable');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50'>
      {/* Hero */}
      <div className='relative overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 text-white'>
        <div className='absolute inset-0 bg-black opacity-10'></div>
        <div className='relative container mx-auto px-4 py-20 text-center'>
          <div className='w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center animate-fade-in-down'>
            <svg
              className='w-11 h-11 text-white'
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
          <h1 className='text-4xl md:text-6xl font-heading font-semibold mb-4 animate-fade-in-down'>
            Bring CookBook+ to Your Home Screen
          </h1>
          <p className='text-lg md:text-xl opacity-90 max-w-2xl mx-auto animate-fade-in-up'>
            Install the app for one-tap access, and share recipes straight
            into CookBook+ from anywhere on your phone.
          </p>
        </div>
        <div className='absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-50 to-transparent'></div>
      </div>

      <div className='container mx-auto px-4 -mt-8 relative z-10 pb-20'>
        <div className='bg-white rounded-2xl shadow-2xl px-8 py-10 max-w-2xl mx-auto text-center transform transition-all duration-300 hover:shadow-3xl'>
          {installState === 'checking' && (
            <div className='flex flex-col items-center py-4'>
              <svg
                className='animate-spin h-8 w-8 text-orange-500 mb-4'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              <p className='text-gray-600'>Checking install options…</p>
            </div>
          )}

          {installState === 'installable' && (
            <>
              <h2 className='text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3'>
                Ready to install
              </h2>
              <p className='text-gray-600 mb-8'>
                Tap below to add CookBook+ to your home screen.
              </p>
              <button
                onClick={handleInstallClick}
                className='bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform hover:scale-105 text-white font-semibold py-4 px-10 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-200'
              >
                Install CookBook+
              </button>
            </>
          )}

          {installState === 'installing' && (
            <div className='flex flex-col items-center py-4'>
              <svg
                className='animate-spin h-8 w-8 text-orange-500 mb-4'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              <p className='text-gray-600'>Waiting for confirmation…</p>
            </div>
          )}

          {installState === 'installed' && (
            <>
              <div className='w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-9 h-9 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
              <h2 className='text-2xl font-bold text-gray-800 mb-3'>
                CookBook+ is installed
              </h2>
              <p className='text-gray-600'>
                Open it from your home screen, or try sharing a recipe link
                into it from any browser or app.
              </p>
            </>
          )}

          {installState === 'unsupported' && (
            <>
              <h2 className='text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3'>
                Add CookBook+ manually
              </h2>
              <p className='text-gray-600 mb-8 max-w-md mx-auto'>
                Your browser doesn&apos;t support one-tap install, but you can
                still add CookBook+ to your home screen:
              </p>
              <div
                className={`grid gap-4 text-left ${
                  platform === 'other' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'
                }`}
              >
                {(platform === 'android' || platform === 'other') && (
                  <div className='bg-gray-50 rounded-xl p-5 border border-gray-200'>
                    <p className='font-semibold text-gray-800 mb-2'>
                      Android (Chrome)
                    </p>
                    <p className='text-sm text-gray-600'>
                      Tap the <span className='font-medium'>⋮</span> menu,
                      then{' '}
                      <span className='font-medium'>
                        &quot;Add to Home screen&quot;
                      </span>
                      .
                    </p>
                  </div>
                )}
                {(platform === 'ios' || platform === 'other') && (
                  <div className='bg-gray-50 rounded-xl p-5 border border-gray-200'>
                    <p className='font-semibold text-gray-800 mb-2'>
                      iPhone (Safari)
                    </p>
                    <p className='text-sm text-gray-600'>
                      Tap the Share icon, then{' '}
                      <span className='font-medium'>
                        &quot;Add to Home Screen&quot;
                      </span>
                      .
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Why install */}
        <div className='max-w-4xl mx-auto mt-16 grid sm:grid-cols-3 gap-6'>
          <div className='bg-white rounded-2xl shadow-lg p-6 text-center transition-all duration-200 hover:shadow-xl hover:scale-105'>
            <div className='w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-orange-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                />
              </svg>
            </div>
            <h3 className='font-semibold text-gray-800 mb-2'>
              Share recipes in
            </h3>
            <p className='text-sm text-gray-600'>
              Found a recipe on another site? Tap Share, pick CookBook+, and
              it prefills the form for you.
            </p>
          </div>
          <div className='bg-white rounded-2xl shadow-lg p-6 text-center transition-all duration-200 hover:shadow-xl hover:scale-105'>
            <div className='w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
            <h3 className='font-semibold text-gray-800 mb-2'>
              One-tap access
            </h3>
            <p className='text-sm text-gray-600'>
              Launch straight from your home screen — no browser tabs to dig
              through.
            </p>
          </div>
          <div className='bg-white rounded-2xl shadow-lg p-6 text-center transition-all duration-200 hover:shadow-xl hover:scale-105'>
            <div className='w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-purple-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
            </div>
            <h3 className='font-semibold text-gray-800 mb-2'>Feels native</h3>
            <p className='text-sm text-gray-600'>
              Runs full-screen like a real app, with its own icon and no
              browser chrome.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
