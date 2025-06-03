'use client'

import { Fragment } from 'react'
import { Transition } from '@headlessui/react'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/20/solid'

interface ToastProps {
  show: boolean
  onClose: () => void
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
}

export default function Toast({ show, onClose, type, title, message }: ToastProps) {
  const Icon = type === 'success' 
    ? CheckCircleIcon 
    : type === 'error' 
    ? XCircleIcon 
    : type === 'warning' 
    ? ExclamationTriangleIcon
    : InformationCircleIcon;

  const iconColor = type === 'success' 
    ? 'text-green-400' 
    : type === 'error' 
    ? 'text-red-400' 
    : type === 'warning' 
    ? 'text-yellow-400' 
    : 'text-blue-400';

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        <Transition
          show={show}
          as={Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <Icon aria-hidden="true" className={`size-6 ${iconColor}`} />
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-black">{title}</p>
                  {message && <p className="mt-1 text-sm text-gray-600">{message}</p>}
                </div>
                <div className="ml-4 flex shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon aria-hidden="true" className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  )
}
