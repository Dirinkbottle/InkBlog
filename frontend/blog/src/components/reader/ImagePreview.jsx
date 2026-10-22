import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function ImagePreview({ image, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      className="image-dialog"
      aria-label="图片预览"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={onClose}
    >
      <button className="icon-button" aria-label="关闭图片预览" autoFocus>
        <X size={22} />
      </button>
      <img src={image.src} alt={image.alt || '文章图片'} />
      {image.alt && <p>{image.alt}</p>}
    </dialog>
  )
}
