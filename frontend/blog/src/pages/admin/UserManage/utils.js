export const getRoleBadge = (role) => {
  const colors = {
    admin: 'bg-red-100 text-red-800',
    editor: 'bg-blue-100 text-blue-800',
    user: 'bg-gray-100 text-gray-800',
  }
  return colors[role] || colors.user
}

export const getStatusBadge = (status) => {
  return status === 'active' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}

export const defaultFormData = {
  role: 'user',
  status: 'active',
  can_create_post: false,
  can_edit_post: false,
  can_delete_post: false,
  can_comment: true,
  can_view_private: false,
}
