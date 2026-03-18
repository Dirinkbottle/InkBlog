import { useSuccessStore } from '@/store/successStore'

export const useSuccessToast = () => {
  const addSuccess = useSuccessStore((state) => state.addSuccess)

  const showSuccess = (success) => {
    addSuccess(success)
  }

  return { showSuccess }
}
