import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export function Drawer({
  open,
  onClose,
  children,
  width = 'max-w-2xl',
  title,
}: { open: boolean; onClose: () => void; children: React.ReactNode; width?: string; title?: string }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${width} bg-surface-1 border-l border-surface-border h-full overflow-y-auto shadow-2xl animate-[slideIn_0.18s_ease-out]`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-sm text-text-secondary hover:text-text-primary hover:bg-white/5 z-10"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}
