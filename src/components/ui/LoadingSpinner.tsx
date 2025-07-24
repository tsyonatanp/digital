import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const colorClasses = {
  primary: 'border-blue-600 border-t-transparent',
  secondary: 'border-gray-600 border-t-transparent',
  white: 'border-white border-t-transparent'
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className 
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  )
}

// Skeleton loading component
interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div
        className={cn(
          'animate-pulse bg-gray-200 rounded',
          className
        )}
      />
    )
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gray-200 rounded',
            i === lines - 1 ? 'w-3/4' : 'w-full',
            className
          )}
          style={{ height: '1rem' }}
        />
      ))}
    </div>
  )
}

// Page loading component
export function PageLoader({ message = 'טוען...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <Skeleton lines={3} className="h-3" />
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <Skeleton className="h-6 w-1/3" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="w-16 h-8 rounded" />
                <Skeleton className="w-16 h-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 