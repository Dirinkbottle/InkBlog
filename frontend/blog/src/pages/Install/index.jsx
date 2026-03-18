import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import axios from 'axios'
import { useErrorToast } from '@/hooks/useErrorToast'
import { useSuccessToast } from '@/hooks/useSuccessToast'
import WelcomeStep from './WelcomeStep'
import DatabaseStep from './DatabaseStep'
import TablesStep from './TablesStep'
import AdminStep from './AdminStep'
import CompletionStep from './CompletionStep'
import { defaultConfig, handleDbTypeChange } from './utils'

export default function Install() {
  const navigate = useNavigate()
  const { showError } = useErrorToast()
  const { showSuccess } = useSuccessToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tables, setTables] = useState([])
  const [config, setConfig] = useState(defaultConfig)

  useEffect(() => {
    checkInstallStatus()
    loadDefaultConfig()
  }, [])
  
  const loadDefaultConfig = async () => {
    try {
      const { data } = await axios.get('/api/v1/install/default-config')
      if (data.data) {
        setConfig(prev => ({
          ...prev,
          db_host: data.data.db_host || prev.db_host,
          db_port: data.data.db_port || prev.db_port,
          db_user: data.data.db_user || prev.db_user,
          db_name: data.data.db_name || prev.db_name,
        }))
      }
    } catch (err) {
      console.error('Failed to load default config:', err)
    }
  }

  useEffect(() => {
    if (step === 3) {
      loadTables()
    }
  }, [step])

  const checkInstallStatus = async () => {
    try {
      const { data } = await axios.get('/api/v1/install/status')
      if (data.data.installed) {
        navigate('/login')
      }
    } catch (err) {
      console.error('Check install status failed:', err)
    }
  }

  const handleChange = (field, value) => {
    if (field === 'db_type') {
      setConfig(handleDbTypeChange(config, value))
    } else {
      setConfig(prev => ({ ...prev, [field]: value }))
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/v1/install/test-db', {
        db_type: config.db_type,
        db_host: config.db_host,
        db_port: config.db_port,
        db_user: config.db_user,
        db_pass: config.db_pass,
        db_name: config.db_name,
      })
      showSuccess('数据库连接成功！')
      setStep(3)
    } catch (err) {
      const errorMsg = err.response?.data?.message || '数据库连接失败'
      setError(errorMsg)
      showError({
        title: '数据库连接失败',
        message: errorMsg,
        details: err.response?.status ? `HTTP ${err.response.status}` : null
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTables = async () => {
    try {
      const { data } = await axios.get('/api/v1/install/tables')
      setTables(data.data.tables)
    } catch (err) {
      const errorMsg = '获取表信息失败'
      setError(errorMsg)
      showError(errorMsg)
    }
  }

  const performInstall = async () => {
    if (!config.admin_pass || config.admin_pass.length < 6) {
      setError('管理员密码至少6位')
      return
    }

    setLoading(true)
    setError('')
    try {
      await axios.post('/api/v1/install/perform', config)
      setStep(5)
    } catch (err) {
      const errorMsg = err.response?.data?.message || '安装失败'
      setError(errorMsg)
      showError({
        title: '安装失败',
        message: errorMsg,
        details: err.response?.status ? `HTTP ${err.response.status}` : null
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            InkBlog 安装向导
          </CardTitle>
          <CardDescription className="text-center">
            步骤 {step} / 5
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
          {step === 2 && (
            <DatabaseStep
              config={config}
              onChange={handleChange}
              onBack={() => setStep(1)}
              onTest={testConnection}
              loading={loading}
              error={error}
            />
          )}
          {step === 3 && (
            <TablesStep
              tables={tables}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <AdminStep
              config={config}
              onChange={handleChange}
              onBack={() => setStep(3)}
              onInstall={performInstall}
              loading={loading}
              error={error}
            />
          )}
          {step === 5 && (
            <CompletionStep
              config={config}
              onNavigateToLogin={() => navigate('/login')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
