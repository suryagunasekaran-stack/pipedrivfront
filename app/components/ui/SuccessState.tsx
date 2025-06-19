'use client';

import React from 'react';

interface SuccessStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function SuccessState({ title, subtitle, icon }: SuccessStateProps) {
  const defaultIcon = (
    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );

  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        {icon || defaultIcon}
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface SuccessHeaderProps {
  children: React.ReactNode;
}

export function SuccessHeader({ children }: SuccessHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {children}
        </div>
      </div>
    </div>
  );
} 