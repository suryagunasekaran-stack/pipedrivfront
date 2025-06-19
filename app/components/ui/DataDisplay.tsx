'use client';

import React from 'react';

interface DataRowProps {
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export function DataRow({ label, value, className = '' }: DataRowProps) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface DataSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DataSection({ title, children }: DataSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

interface KeyValuePairProps {
  label: string;
  value: string | React.ReactNode;
}

export function KeyValuePair({ label, value }: KeyValuePairProps) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

interface DetailCardProps {
  title: string;
  subtitle?: string;
  value?: string;
  extra?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DetailCard({ 
  title, 
  subtitle, 
  value, 
  extra,
  onClick,
  className = '' 
}: DetailCardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={`border border-gray-200 rounded-lg p-4 text-left w-full ${
        onClick ? 'hover:bg-gray-50 transition-colors cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {value && (
          <div className="text-right ml-4">
            <p className="text-sm font-medium text-gray-900">{value}</p>
          </div>
        )}
      </div>
      {extra}
    </Component>
  );
} 