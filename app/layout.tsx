'use client'
// import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
// import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Inter } from "next/font/google";
import './globals.css';
import { useState, useEffect, Suspense } from 'react';
import SimpleLoader from './components/SimpleLoader';
import { Toaster } from 'react-hot-toast';
import { AppInitializer } from './components/AppInitializer';
import { ErrorBoundary } from './components/ErrorBoundary'; // Import ErrorBoundary

const inter = Inter({ subsets: ["latin"] });

// Navigation can be adjusted as needed (currently commented out for simplicity in RootLayout)
// const navigation = [
//   { name: 'Pipedrive Data View', href: '/pipedrive-data-view', current: true },
//   { name: 'Create Project', href: '/create-project-page', current: false },
// ]

// function classNames(...classes: string[]) {
//   return classes.filter(Boolean).join(' ')
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1500); // Simulating an initial app loading time, can be adjusted or removed

    return () => clearTimeout(timer);
  }, []);

  // A simple loading fallback for Suspense
  const SuspenseFallback = (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      <p className="ml-4 text-gray-700">Loading application...</p>
    </div>
  );

  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary> {/* Wrap the entire content that could throw runtime errors */}
          <Suspense fallback={SuspenseFallback}>
            <AppInitializer>
              {/* The main application content (children) will be rendered here */}
              {/* Any navbars or persistent layout elements can also go inside AppInitializer or around children */}

              {/* Example of where children (page content) would go, potentially within a more complex layout */}
              {/* For now, children are directly rendered by AppInitializer's {children} prop */}
              {children}

              {/* Global Toaster for notifications */}
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                  className: '',
                  duration: 4000,
                  style: { background: '#333', color: '#fff' }, // Adjusted default style slightly for visibility
                  success: { duration: 3000, iconTheme: { primary: '#10B981', secondary: '#fff' }}, // Green
                  error: { duration: 5000, iconTheme: { primary: '#EF4444', secondary: '#fff' }}, // Red
                  loading: { duration: Infinity },
                }}
              />
            </AppInitializer>
          </Suspense>
        </ErrorBoundary>
        {/* appLoading shows a loader over everything, including ErrorBoundary fallback if error happens during initial 1.5s */}
        {/* This might be desired, or ErrorBoundary could be outside appLoading logic too. */}
        {/* For now, if appLoading is true, it will cover even the ErrorBoundary's UI. */}
        {appLoading && <SimpleLoader message="Initializing..." />}
      </body>
    </html>
  );
}
