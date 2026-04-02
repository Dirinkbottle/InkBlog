import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authAPI } from '@/services/api'

export default function VerifyEmailSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const token = searchParams.get('token')
  const hasVerified = useRef(false)

  useEffect(() => {
    const verifyEmail = async () => {
      // 防止重复执行
      if (hasVerified.current) {
        return
      }
      hasVerified.current = true

      if (!token) {
        setStatus('error')
        setMessage('验证链接无效')
        return
      }

      try {
        const response = await authAPI.verifyEmail(token)
        setStatus('success')
        setMessage(response.message || '邮箱验证成功')
        
        // 3秒后跳转到登录页
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } catch (error) {
        setStatus('error')
        setMessage(error.message || '验证失败，请重试')
      }
    }

    verifyEmail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-sky-50 p-4">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
               style={{
                 backgroundColor: status === 'success' ? 'rgb(220 252 231)' : 
                                 status === 'error' ? 'rgb(254 226 226)' : 'rgb(219 234 254)'
               }}>
            {status === 'loading' && <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-red-600" />}
          </div>
          <CardTitle className="text-2xl text-slate-900">
            {status === 'loading' && '验证中...'}
            {status === 'success' && '验证成功'}
            {status === 'error' && '验证失败'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-slate-600">{message}</p>
          
          {status === 'success' && (
            <p className="text-center text-sm text-slate-500">
              正在跳转到登录页面...
            </p>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <Button
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => navigate('/register')}
              >
                重新注册
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-700"
                onClick={() => navigate('/login')}
              >
                返回登录
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

