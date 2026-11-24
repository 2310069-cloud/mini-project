import React, { useEffect, useRef } from 'react'
import { SEVERITY_STYLES } from '../lib/severity'
import { relativeTime } from '../lib/format'
import { useSoc } from '../context/SocContext'
import { CheckCheck } from 'lucide-react'

export function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markAllRead, markRead, navigateTo } = useSoc()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 w-[360px] max-h-[480px] bg-surface-3 border border-surface-borderLight rounded-md shadow-panel overflow-hidden z-40 flex flex-col"
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-surface-border shrink-0">
        <span className="text-[13px] font-semibold text-text-primary">Notifications</span>
        <button
          onClick={markAllRead}
          className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-dim font-medium"
        >
          <CheckCheck size={13} /> Mark all read
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
        {notifications.map((n) => {
          const sev = SEVERITY_STYLES[n.severity]
          return (
            <button
              key={n.id}
              onClick={() => {
                markRead(n.id)
                if (n.link) navigateTo(n.link.page, n.link.id ? { id: n.link.id } : {})
                onClose()
              }}
              className={`w-full text-left px-3.5 py-2.5 border-b border-surface-border/60 hover:bg-white/[0.03] transition-colors flex gap-2.5 ${
                !n.read ? 'bg-white/[0.02]' : ''
              }`}
            >
              <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${sev.dot} ${!n.read ? '' : 'opacity-40'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[12.5px] font-medium ${!n.read ? 'text-text-primary' : 'text-text-secondary'} truncate`}>
                    {n.title}
                  </span>
                </div>
                <p className="text-[11.5px] text-text-muted mt-0.5 leading-snug">{n.detail}</p>
                <span className="text-[10px] text-text-muted/70 mt-1 inline-block">{relativeTime(n.timestamp)}</span>
              </div>
            </button>
          )
        })}
        {notifications.length === 0 && (
          <div className="p-6 text-center text-text-muted text-xs">No notifications</div>
        )}
      </div>
    </div>
  )
}
