import React, { useState, useEffect } from 'react'
import { adminAPI } from '@/services/api'
import { useErrorToast } from '@/hooks/useErrorToast'
import { shouldShowLocalApiError } from '@/utils/apiErrors'
import UserFilters from './UserFilters'
import UserTable from './UserTable'
import EditUserDialog from './EditUserDialog'
import { defaultFormData } from './utils'

export default function UserManage() {
  const { showError } = useErrorToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState(defaultFormData)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      if (statusFilter) params.status = statusFilter
      
      const res = await adminAPI.getUsers(params)
      setUsers(res.data.users || [])
    } catch (error) {
      console.error('获取用户列表失败:', error)
      showError(error.message || '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter, statusFilter])

  const handleEdit = (user) => {
    setEditingUser(user)
    // 从 permissions 对象中加载权限（新结构）
    const permissions = user.permissions || {}
    setFormData({
      role: user.role,
      status: user.status,
      can_create_post: permissions.can_create_post || false,
      can_edit_post: permissions.can_edit_post || false,
      can_delete_post: permissions.can_delete_post || false,
      can_comment: permissions.can_comment !== undefined ? permissions.can_comment : true,
      can_view_private: permissions.can_view_private || false,
      can_comment_without_approval: permissions.can_comment_without_approval || false,
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // 构建新的 permissions 对象结构
      const updateData = {
        role: formData.role,
        status: formData.status,
        permissions: {
          can_create_post: formData.can_create_post,
          can_edit_post: formData.can_edit_post,
          can_delete_post: formData.can_delete_post,
          can_comment: formData.can_comment,
          can_view_private: formData.can_view_private,
          can_comment_without_approval: formData.can_comment_without_approval,
        }
      }
      await adminAPI.updateUser(editingUser.id, updateData)
      setShowDialog(false)
      fetchUsers()
    } catch (error) {
      console.error('更新失败:', error)
      if (shouldShowLocalApiError(error)) {
        showError(error.message || '更新失败')
      }
    }
  }

  const handleBan = async (id) => {
    if (!confirm('确定要封禁这个用户吗？')) return
    
    try {
      await adminAPI.banUser(id)
      fetchUsers()
    } catch (error) {
      console.error('封禁失败:', error)
      if (shouldShowLocalApiError(error)) {
        showError(error.message || '封禁失败')
      }
    }
  }

  const handleUnban = async (id) => {
    if (!confirm('确定要解封这个用户吗？')) return
    
    try {
      await adminAPI.unbanUser(id)
      fetchUsers()
    } catch (error) {
      console.error('解封失败:', error)
      if (shouldShowLocalApiError(error)) {
        showError(error.message || '解封失败')
      }
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个用户吗？此操作不可恢复！')) return
    
    try {
      await adminAPI.deleteUser(id)
      fetchUsers()
    } catch (error) {
      console.error('删除失败:', error)
      if (shouldShowLocalApiError(error)) {
        showError(error.message || '删除失败')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">用户管理</h1>
      </div>

      <UserFilters
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <UserTable
        users={users}
        loading={loading}
        onEdit={handleEdit}
        onBan={handleBan}
        onUnban={handleUnban}
        onDelete={handleDelete}
      />

      {showDialog && editingUser && (
        <EditUserDialog
          user={editingUser}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  )
}
