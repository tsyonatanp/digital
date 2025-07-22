import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import { retry } from '@/lib/utils'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  retries?: number
  retryDelay?: number
  showToast?: boolean
}

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T = any>(options: UseApiOptions<T> = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const { addToast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    customOptions?: Partial<UseApiOptions<T>>
  ) => {
    const finalOptions = { ...options, ...customOptions }
    
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await retry(
        async () => {
          const result = await apiCall()
          
          // Check if request was cancelled
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Request cancelled')
          }
          
          return result
        },
        finalOptions.retries || 3,
        finalOptions.retryDelay || 1000
      )

      setState({ data, loading: false, error: null })

      if (finalOptions.onSuccess) {
        finalOptions.onSuccess(data)
      }

      if (finalOptions.showToast !== false) {
        addToast({
          type: 'success',
          title: 'הפעולה הושלמה בהצלחה'
        })
      }

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בלתי צפויה'
      
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))

      if (finalOptions.onError) {
        finalOptions.onError(errorMessage)
      }

      if (finalOptions.showToast !== false) {
        addToast({
          type: 'error',
          title: 'שגיאה',
          message: errorMessage
        })
      }

      return { data: null, error: errorMessage }
    }
  }, [options, addToast])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    ...state,
    execute,
    reset,
    cancel
  }
}

// Specialized hooks for common operations
export function useSupabaseQuery<T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: UseApiOptions<{ data: T | null; error: any }>
) {
  return useApi<{ data: T | null; error: any }>(options).execute(queryFn)
}

export function useSupabaseMutation<T = any>(
  mutationFn: (variables: any) => Promise<{ data: T | null; error: any }>,
  options?: UseApiOptions<{ data: T | null; error: any }>
) {
  const api = useApi<{ data: T | null; error: any }>(options)

  const mutate = useCallback(async (variables: any) => {
    return api.execute(() => mutationFn(variables))
  }, [api, mutationFn])

  return {
    ...api,
    mutate
  }
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export function useCachedApi<T = any>(
  key: string,
  apiCall: () => Promise<T>,
  ttl: number = 5 * 60 * 1000, // 5 minutes default
  options?: UseApiOptions<T>
) {
  const api = useApi<T>(options)

  const executeWithCache = useCallback(async () => {
    const cached = cache.get(key)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < cached.ttl) {
      api.reset()
      return { data: cached.data, error: null }
    }

    const result = await api.execute(apiCall)
    
    if (result.data) {
      cache.set(key, { data: result.data, timestamp: now, ttl })
    }

    return result
  }, [key, apiCall, ttl, api])

  return {
    ...api,
    execute: executeWithCache
  }
}

// Utility to clear cache
export function clearApiCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
} 