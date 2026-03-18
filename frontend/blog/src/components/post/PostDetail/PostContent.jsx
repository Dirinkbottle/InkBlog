import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function PostContent({ content, theme }) {
  return (
    <div className="markdown-body prose prose-lg dark:prose-invert max-w-none overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={theme === 'dark' ? vscDarkPlus : vs}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: '1.5rem 0',
                  borderRadius: '0.5rem',
                  maxWidth: '100%',
                  overflow: 'auto',
                }}
                wrapLines={true}
                wrapLongLines={true}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          table({ node, ...props }) {
            return (
              <div className="overflow-x-auto">
                <table {...props} />
              </div>
            )
          },
          img({ node, ...props }) {
            return <img {...props} style={{ maxWidth: '100%', height: 'auto' }} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
