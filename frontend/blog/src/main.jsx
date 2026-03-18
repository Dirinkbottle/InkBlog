import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/markdown-mobile.css'
import { initTheme } from './store/themeStore'
import { initClientSessionTransport } from './services/clientSession'

// 初始化主题
initTheme()
initClientSessionTransport()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

