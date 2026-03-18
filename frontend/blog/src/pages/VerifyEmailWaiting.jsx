import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'
import { authAPI } from '@/services/api'

export default function VerifyEmailWaiting() {
  const location = useLocation()
  const navigate = useNavigate()
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(0)
  const email = location.state?.email || ''
  const expiryHours = location.state?.expiry_hours || 24

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    try {
      setResending(true)
      setMessage('')
      await authAPI.resendVerification(email)
      setMessage('验证邮件已重新发送，请查收邮箱')
      setCountdown(60) // 设置60秒倒计时
    } catch (error) {
      setMessage(error.response?.data?.message || '发送失败，请稍后重试')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">验证您的邮箱</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">我们已向以下邮箱发送了验证链接：</p>
            <p className="font-semibold text-primary">{email}</p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">请完成以下步骤：</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>打开您的邮箱</li>
                  <li>找到来自 InkBlog 的验证邮件</li>
                  <li>点击邮件中的验证按钮</li>
                </ol>
              </div>
            </div>
          </div>

          {message && (
            <div className={`text-center text-sm ${message.includes('失败') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </div>
          )}

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resending || countdown > 0}
            >
              {resending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  发送中...
                </>
              ) : countdown > 0 ? (
                `${countdown}秒后可重发`
              ) : (
                '重新发送验证邮件'
              )}
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              返回登录
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            验证链接将在 {expiryHours} 小时后过期。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

