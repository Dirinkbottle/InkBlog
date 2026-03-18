import { useErrorStore } from '@/store/errorStore'

export const useErrorToast = () => {
  const { addError } = useErrorStore()

  const showError = (error) => {
    if (typeof error === 'string') {
      addError({ message: error })
    } else if (error instanceof Error) {
      addError({
        title: error.name || '错误',
        message: error.message,
        details: error.stack?.split('\n')[0],
      })
    } else {
      addError(error)
    }
  }

  return { showError }
}
