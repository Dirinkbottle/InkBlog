export const settingsTabs = [
  { id: 'site', label: '基本设置' },
  { id: 'comment', label: '评论设置' },
  { id: 'email', label: '邮件设置' },
]

export const defaultSettings = {
  site_description: '',
  footer_text: '',
  icp_number: '',
  comment_auto_approve: 'true',
  comment_require_moderation: 'false',
  email_verification_enabled: 'true',
  email_verification_expiry_hours: '24',
  email_smtp_host: '',
  email_smtp_port: '587',
  email_smtp_username: '',
  email_smtp_password: '',
  email_from_address: '',
  email_from_name: 'InkBlog',
  email_library: 'gomail',
}
