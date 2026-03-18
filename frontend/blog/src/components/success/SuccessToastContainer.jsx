import React from 'react'
import { useSuccessStore } from '@/store/successStore'
import { CheckCircle, X } from 'lucide-react'

export default function SuccessToastContainer() {
  const { successes, removeSuccess } = useSuccessStore()

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {successes.map((success, index) => (
        <div
          key={success.id}
          className="pointer-events-auto bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4 min-w-[320px] max-w-md animate-slideDown"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: 'backwards'
          }}
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                {success.message}
              </p>
              {success.details && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {success.details}
                </p>
              )}
            </div>
            <button
              onClick={() => removeSuccess(success.id)}
              className="flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
