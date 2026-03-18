export const defaultConfig = {
  db_type: 'mysql',
  db_host: 'localhost',
  db_port: '3306',
  db_user: 'root',
  db_pass: '',
  db_name: 'inkblog',
  admin_user: 'admin',
  admin_email: 'admin@example.com',
  admin_pass: '',
}

export const handleDbTypeChange = (config, newType) => {
  return {
    ...config,
    db_type: newType,
    db_port: newType === 'mysql' ? '3306' : '5432'
  }
}
