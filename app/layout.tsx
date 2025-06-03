'use client'
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Inter } from "next/font/google";
import './globals.css';
import { useState, useEffect } from 'react'; // Import useState and useEffect
import SimpleLoader from './components/SimpleLoader'; // Import the SimpleLoader
import { Toaster } from 'react-hot-toast'; // Import Toaster

const inter = Inter({ subsets: ["latin"] });

const navigation = [
  { name: 'Pipedrive Data', href: '/', current: true }, // Updated to point to a relevant page
  // Add other navigation items if needed
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [appLoading, setAppLoading] = useState(true); // Add appLoading state

  // Effect for the initial 3-second app loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1500); // Show loader for 3 seconds

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        {children} 
        {appLoading && <SimpleLoader />}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // Define default options
            className: '',
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            // Default options for specific types
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              duration: Infinity,
            },
          }}
        />
      </body>
    </html>
  );
}
