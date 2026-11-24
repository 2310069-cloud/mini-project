import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md'

const VARIANT_CLS: Record<Variant, string> = {
  primary: 'bg-accent hover:bg-accent-dim text-white border border-accent',
  secondary: 'bg-surface-3 hover:bg-surface-4 text-text-primary border border-surface-borderLight',
  ghost: 'bg-transparent hover:bg-white/5 text-text-secondary border border-transparent',
  outline: 'bg-transparent hover:bg-white/5 text-text-primary border border-surface-borderLight',
  danger: 'bg-sev-critical/15 hover:bg-sev-critical/25 text-sev-critical border border-sev-critical/40',
}

const SIZE_CLS: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-sm px-3.5 py-2 gap-2',
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  disabled = false,
  type = 'button',
  title,
}: {
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  title?: string
}) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-sm font-medium transition-colors duration-100 focus-ring disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${VARIANT_CLS[variant]} ${SIZE_CLS[size]} ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}

export function IconButton({
  onClick,
  icon,
  active = false,
  title,
  className = '',
}: { onClick?: (e: React.MouseEvent) => void; icon: React.ReactNode; active?: boolean; title?: string; className?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-sm border transition-colors focus-ring ${
        active
          ? 'bg-accent/15 border-accent/40 text-accent'
          : 'bg-transparent border-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary'
      } ${className}`}
    >
      {icon}
    </button>
  )
}
