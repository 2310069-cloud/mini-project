import React from 'react'
import { ChevronDown } from 'lucide-react'

export function SelectFilter({
  label,
  value,
  options,
  onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-surface-3 border border-surface-borderLight rounded-sm pl-2.5 pr-7 py-1.5 text-[12.5px] text-text-primary hover:border-surface-border focus-ring cursor-pointer"
      >
        <option value="All">{label}: All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {label}: {o}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-1.5 text-[12.5px] text-text-primary placeholder:text-text-muted focus-ring min-w-[200px]"
    />
  )
}
