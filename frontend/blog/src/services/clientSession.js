import axios from 'axios'

const CLIENT_SESSION_STORAGE_KEY = 'inkblog_client_session_id'

export function getClientSessionId() {
  let sessionId = sessionStorage.getItem(CLIENT_SESSION_STORAGE_KEY)
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`
    sessionStorage.setItem(CLIENT_SESSION_STORAGE_KEY, sessionId)
  }
  return sessionId
}

export function attachClientSessionHeader(headers = {}) {
  return {
    ...headers,
    'X-Client-Session-Id': getClientSessionId(),
  }
}

export function initClientSessionTransport() {
  axios.defaults.headers.common['X-Client-Session-Id'] = getClientSessionId()
}
