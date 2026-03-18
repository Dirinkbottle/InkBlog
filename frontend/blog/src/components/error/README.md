# 全局错误提示系统

## 功能特性

- ✅ 美观的 UI 设计，右上角悬浮显示
- ✅ 从上往下滑入动画
- ✅ 最多同时显示 5 个错误，自动队列管理
- ✅ 5 秒后自动淡出消失
- ✅ 支持手动关闭
- ✅ 控制台同步输出，不会静默报错
- ✅ 自动捕获 React 组件错误
- ✅ 自动捕获全局 JavaScript 错误
- ✅ 自动捕获未处理的 Promise rejection

## 使用方法

### 1. 在组件中手动触发错误提示

```jsx
import { useErrorToast } from '@/hooks/useErrorToast'

function MyComponent() {
  const { showError } = useErrorToast()

  const handleAction = async () => {
    try {
      await someAsyncOperation()
    } catch (error) {
      // 方式 1: 直接传入字符串
      showError('操作失败，请重试')
      
      // 方式 2: 传入 Error 对象（会自动提取 message 和 stack）
      showError(error)
      
      // 方式 3: 传入自定义对象
      showError({
        title: '网络错误',
        message: '无法连接到服务器',
        details: 'ERR_CONNECTION_REFUSED'
      })
    }
  }

  return <button onClick={handleAction}>执行操作</button>
}
```

### 2. 在 API 请求中使用

```jsx
import { useErrorToast } from '@/hooks/useErrorToast'
import { adminAPI } from '@/services/api'

function DataFetcher() {
  const { showError } = useErrorToast()

  const fetchData = async () => {
    try {
      const response = await adminAPI.getData()
      // 处理数据...
    } catch (error) {
      showError({
        title: '数据加载失败',
        message: error.response?.data?.message || error.message,
        details: error.response?.status ? `HTTP ${error.response.status}` : null
      })
    }
  }

  return <button onClick={fetchData}>加载数据</button>
}
```

### 3. 自动错误捕获

系统会自动捕获以下类型的错误：

**React 组件错误**
```jsx
// ErrorBoundary 会自动捕获组件渲染错误
function BuggyComponent() {
  throw new Error('组件崩溃了')
}
```

**全局 JavaScript 错误**
```javascript
// 会被自动捕获并显示
throw new Error('全局错误')

// 或者
undefinedFunction() // ReferenceError 会被捕获
```

**未处理的 Promise rejection**
```javascript
// 会被自动捕获并显示
Promise.reject('异步错误')

// 或者
async function fetchData() {
  throw new Error('异步操作失败')
}
fetchData() // 如果没有 .catch()，会被全局捕获
```

## 技术实现

- **状态管理**: Zustand (轻量级状态管理)
- **动画**: CSS keyframes + Tailwind
- **队列管理**: 自动限制最多 5 个错误
- **自动清理**: 5 秒后自动移除

## 文件结构

```
src/
├── components/error/
│   ├── ErrorToastContainer.jsx  # 错误提示容器组件
│   ├── ErrorBoundary.jsx        # React 错误边界
│   └── README.md                # 使用文档
├── hooks/
│   └── useErrorToast.js         # 错误提示 Hook
├── store/
│   └── errorStore.js            # 错误状态管理
└── utils/
    └── globalErrorHandler.js    # 全局错误处理器
```

## 工作原理

1. **全局错误捕获** (`globalErrorHandler.js`)
   - 监听 `window.error` 事件捕获 JavaScript 运行时错误
   - 监听 `unhandledrejection` 事件捕获未处理的 Promise 错误

2. **React 错误边界** (`ErrorBoundary.jsx`)
   - 使用 React 的 `componentDidCatch` 捕获组件树中的错误

3. **手动错误上报** (`useErrorToast` Hook)
   - 在 try-catch 中手动调用 `showError()`

所有错误最终都会通过 `errorStore` 统一管理并显示。
