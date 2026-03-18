import React, { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminAPI } from '@/services/api'
import BasicSettingsTab from './BasicSettingsTab'
import CommentSettingsTab from './CommentSettingsTab'
import EmailSettingsTab from './EmailSettingsTab'
import { settingsTabs, defaultSettings } from './utils'

export default function SiteSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('site')
  const [settings, setSettings] = useState(defaultSettings)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getSettings()
      if (res.data) {
        setSettings(prev => ({ ...prev, ...res.data }))
      }
    } catch (error) {
      console.error('获取设置失败:', error)
      alert(error.message || '获取设置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await adminAPI.updateSettings(settings)
      alert('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      alert(error.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">网站设置</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          保存设置
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div>
          <div className="border-b mb-6">
            <div className="flex space-x-4">
              {settingsTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'site' && <BasicSettingsTab settings={settings} setSettings={setSettings} />}
          {activeTab === 'comment' && <CommentSettingsTab settings={settings} setSettings={setSettings} />}
          {activeTab === 'email' && <EmailSettingsTab settings={settings} setSettings={setSettings} />}
        </div>
      )}
    </div>
  )
}
