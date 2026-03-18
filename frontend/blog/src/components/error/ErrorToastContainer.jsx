import React, { useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { useErrorStore } from '@/store/errorStore'

const ErrorToast = ({ error, index, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(error.id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [error.id, onRemove])

  return (
    <div
      className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg min-w-[320px] max-w-[420px] animate-slide-down"
      style={{
        animation: 'slideDown 0.3s ease-out, fadeOut 0.5s ease-in 4.5s forwards',
        marginBottom: index > 0 ? '12px' : '0',
      }}
    >
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
          {error.title || '错误'}
        </p>
        <p className="text-sm text-red-700 dark:text-red-300 break-words">
          {error.message}
        </p>
        {error.details && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
            {error.details}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(error.id)}
        className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ErrorToastContainer() {
  const { errors, removeError } = useErrorStore()
  const visibleErrors = errors.slice(0, 5)

  if (visibleErrors.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-3">
      {visibleErrors.map((error, index) => (
        <ErrorToast
          key={error.id}
          error={error}
          index={index}
          onRemove={removeError}
        />
      ))}
    </div>
  )
}
