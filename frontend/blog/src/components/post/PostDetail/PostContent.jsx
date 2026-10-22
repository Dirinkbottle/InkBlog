import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import CodeBlock from '../../reader/CodeBlock'
import ImagePreview from '../../reader/ImagePreview'

export default function PostContent({ content, theme }) {
  const [preview, setPreview] = useState(null)
  return (
    <>
      <div className="markdown-body prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            pre({ children }) {
              return <CodeBlock theme={theme}>{children}</CodeBlock>
            },
            table({ node, ...props }) {
              return (
                <div className="overflow-x-auto">
                  <table {...props} />
                </div>
              )
            },
            img({ node, ...props }) {
              return (
                <img
                  {...props}
                  loading="lazy"
                  tabIndex={0}
                  role="button"
                  aria-label={`查看大图：${props.alt || '文章图片'}`}
                  onClick={() => setPreview({ src: props.src, alt: props.alt })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setPreview({ src: props.src, alt: props.alt })
                    }
                  }}
                />
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {preview && (
        <ImagePreview image={preview} onClose={() => setPreview(null)} />
      )}
    </>
  )
}
