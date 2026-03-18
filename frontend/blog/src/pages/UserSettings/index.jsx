import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProfileTab from './ProfileTab'
import SecurityTab from './SecurityTab'

const tabs = [
  { id: 'profile', label: '基本信息', icon: User },
  { id: 'security', label: '安全设置', icon: Lock },
]

export default function UserSettings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* 页面标题 */}
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">个人设置</h1>
            </div>

            {/* 左侧导航 + 右侧内容 */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* 左侧导航 */}
              <nav className="md:w-56 shrink-0">
                <div className="bg-background rounded-lg border p-2 md:sticky md:top-20">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </nav>

              {/* 右侧内容 */}
              <div className="flex-1 min-w-0">
                <div className="bg-background rounded-lg border p-6">
                  {activeTab === 'profile' && <ProfileTab />}
                  {activeTab === 'security' && <SecurityTab />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}