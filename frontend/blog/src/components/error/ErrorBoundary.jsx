import React from 'react'
import { useErrorStore } from '@/store/errorStore'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    if (this.props.addError) {
      this.props.addError({
        title: 'React 组件错误',
        message: error.message,
        details: errorInfo.componentStack?.split('\n')[1]?.trim(),
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">出错了</h1>
            <p className="text-muted-foreground mb-4">页面遇到了一些问题</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function ErrorBoundaryWrapper({ children, fallback }) {
  const { addError } = useErrorStore()
  
  return (
    <ErrorBoundary addError={addError} fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}
