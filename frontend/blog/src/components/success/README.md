# 全局成功提示系统

## 功能特性

- ✅ 美观的绿色 UI 设计，右上角悬浮显示
- ✅ 从上往下滑入动画
- ✅ 最多同时显示 5 个成功提示，自动队列管理
- ✅ 3 秒后自动淡出消失
- ✅ 支持手动关闭
- ✅ 控制台同步输出

## 使用方法

### 1. 在组件中触发成功提示

```jsx
import { useSuccessToast } from '@/hooks/useSuccessToast'

function MyComponent() {
  const { showSuccess } = useSuccessToast()

  const handleSave = async () => {
    try {
      await saveData()
      // 简单用法
      showSuccess('保存成功')
      
      // 完整用法（带详情）
      showSuccess({
        message: '保存成功',
        details: '数据已同步到服务器'
      })
    } catch (error) {
      // 处理错误...
    }
  }

  return <button onClick={handleSave}>保存</button>
}
```

### 2. 替换 alert 的示例

**旧代码：**
```jsx
try {
  await updateUser(id, data)
  alert('更新成功')
} catch (error) {
  alert('更新失败')
}
```

**新代码：**
```jsx
import { useSuccessToast } from '@/hooks/useSuccessToast'
import { useErrorToast } from '@/hooks/useErrorToast'

function Component() {
  const { showSuccess } = useSuccessToast()
  const { showError } = useErrorToast()

  try {
    await updateUser(id, data)
    showSuccess('更新成功')
  } catch (error) {
    showError('更新失败')
  }
}
```

## 技术实现

- **状态管理**: Zustand (轻量级状态管理)
- **动画**: CSS keyframes + Tailwind
- **队列管理**: 自动限制最多 5 个提示
- **自动清理**: 3 秒后自动移除

## 文件结构

```
src/
├── components/success/
│   ├── SuccessToastContainer.jsx  # 成功提示容器组件
│   └── README.md                  # 使用文档
├── hooks/
│   └── useSuccessToast.js         # 成功提示 Hook
└── store/
    └── successStore.js            # 成功提示状态管理
```

## 批量替换指南

需要替换的 alert 模式：

1. **成功提示**：`alert('xxx成功')` → `showSuccess('xxx成功')`
2. **完成提示**：`alert('xxx已xxx')` → `showSuccess('xxx已xxx')`
3. **验证提示**：`alert('请xxx')` → `showError('请xxx')`
4. **失败提示**：`alert('xxx失败')` → `showError('xxx失败')`

## 注意事项

- 确保在组件顶部导入 hooks
- 在函数组件中调用 hooks
- 成功提示使用绿色主题，错误提示使用红色主题
- 两个系统可以同时使用，互不干扰
