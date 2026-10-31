import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from 'sonner'
import { copyText } from '../../lib/reading'

Object.entries({
  javascript,
  typescript,
  jsx,
  tsx,
  python,
  go,
  bash,
  json,
  css,
  markup,
  sql,
  rust,
  yaml,
  markdown,
}).forEach(([name, grammar]) =>
  SyntaxHighlighter.registerLanguage(name, grammar),
)

export default function CodeBlock({ children, theme }) {
  const [copied, setCopied] = useState(false)
  const code = React.isValidElement(children) ? children.props : { children }
  const source = String(code.children || '').replace(/\n$/, '')
  const language =
    /language-([\w+-]+)/.exec(code.className || '')?.[1] || 'text'
  const copy = async () => {
    try {
      await copyText(source)
      setCopied(true)
    } catch {
      toast.error('复制失败，请选中代码手动复制')
    }
  }
  return (
    <div className="code-block">
      <button className="code-copy" onClick={copy} aria-label="复制代码">
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? '已复制' : '复制代码'}
      </button>
      <SyntaxHighlighter
        language={language}
        style={theme === 'dark' ? vscDarkPlus : vs}
        customStyle={{
          margin: '1.5rem 0',
          paddingTop: '42px',
          fontSize: '13px',
          borderRadius: '8px',
        }}
        wrapLongLines={false}
      >
        {source}
      </SyntaxHighlighter>
    </div>
  )
}
