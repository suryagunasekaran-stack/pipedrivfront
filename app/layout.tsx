'use client'
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import './globals.css';

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
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-100">
        <div className="min-h-full">
          <Disclosure as="nav" className="border-b border-gray-200 bg-white">
            {({ open }) => (
              <>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex shrink-0 items-center">
                        <span className="text-lg font-bold text-indigo-600">Your Company</span>
                        </div>
                      <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                        {navigation.map((item) => (
                          <a
                            key={item.name}
                            href={item.href}
                            aria-current={item.current ? 'page' : undefined}
                            className={classNames(
                              item.current
                                ? 'border-indigo-500 text-gray-900'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                              'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                            )}
                          >
                            {item.name}
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">


                      {/* Profile dropdown */}
                      <Menu as="div" className="relative ml-3">
                        <div>
                          <MenuButton className="relative flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">

                          </MenuButton>
                        </div>
                        <MenuItems
                          transition
                          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-200 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in"
                        >
                        </MenuItems>
                      </Menu>
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                      {/* Mobile menu button */}
                      <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        <span className="absolute -inset-0.5" />
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className={classNames(open ? 'hidden' : 'block', 'size-6')} />
                        <XMarkIcon aria-hidden="true" className={classNames(open ? 'block' : 'hidden', 'size-6')} />
                      </DisclosureButton>
                    </div>
                  </div>
                </div>

                <DisclosurePanel className="sm:hidden">
                  <div className="space-y-1 pt-2 pb-3">
                    {navigation.map((item) => (
                      <DisclosureButton
                        key={item.name}
                        as="a"
                        href={item.href}
                        aria-current={item.current ? 'page' : undefined}
                        className={classNames(
                          item.current
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
                          'block border-l-4 py-2 pr-4 pl-3 text-base font-medium'
                        )}
                      >
                        {item.name}
                      </DisclosureButton>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-4 pb-3">
                    <div className="flex items-center px-4">
                      <div className="shrink-0">

                      </div>
                      <div className="ml-3">
                      </div>
                      <button
                        type="button"
                        className="relative ml-auto shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">View notifications</span>
                        <BellIcon aria-hidden="true" className="size-6" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-1">
                    </div>
                  </div>
                </DisclosurePanel>
              </>
            )}
          </Disclosure>

          <div className="py-10 bg-gray-100"> {/* Added bg-gray-100 here */}
            {/* The header part can be dynamic based on the page, or removed if not needed globally */}
            {/* <header>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Page Title</h1>
              </div>
            </header> */}
            <main>
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children} {/* Page content will be rendered here */}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
