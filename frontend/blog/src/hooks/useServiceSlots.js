import { useEffect, useState } from 'react'
import { serviceAdminAPI } from '@/services/api'

const IDLE_POLL_INTERVAL = 5000
const ACTIVE_POLL_INTERVAL = 2000

export function useServiceSlots() {
  const [slots, setSlots] = useState([])
  const [controlLock, setControlLock] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetchSlots = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const response = await serviceAdminAPI.getSlots()
      const payload = response.data || {}
      setSlots(payload.slots || [])
      setControlLock(payload.control_lock || null)
      return payload
    } catch (fetchError) {
      setError(fetchError)
      throw fetchError
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const runAction = async (serviceId, action) => {
    const response = await serviceAdminAPI.runAction(serviceId, action)
    setControlLock(response.data?.control_lock || null)
    return response
  }

  useEffect(() => {
    void fetchSlots().catch(() => {})

    const pollInterval = controlLock ? ACTIVE_POLL_INTERVAL : IDLE_POLL_INTERVAL
    const timer = window.setInterval(() => {
      void fetchSlots({ silent: true }).catch(() => {})
    }, pollInterval)

    return () => window.clearInterval(timer)
  }, [controlLock?.action, controlLock?.service_id])

  return {
    slots,
    controlLock,
    error,
    loading,
    refreshing,
    actionsLocked: Boolean(controlLock),
    fetchSlots,
    runAction,
  }
}
