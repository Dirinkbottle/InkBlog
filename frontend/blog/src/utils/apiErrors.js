export function getApiErrorStatus(error) {
  return error?.response?.status || error?.code || null
}

export function getApiErrorMessage(error, fallback = '操作失败，请稍后重试') {
  return error?.response?.data?.message || error?.message || fallback
}

export function shouldShowLocalApiError(error) {
  const status = getApiErrorStatus(error)
  if (!status) {
    return true
  }

  return status >= 500
}
