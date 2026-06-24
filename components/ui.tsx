'use client'

import { ReactNode } from 'react'

/* ----------------------------------------------------------------- Card */
export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-card ${
        hover ? 'transition-all hover:shadow-pop hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

/* ---------------------------------------------------------------- Badge */
export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode
  tone?: 'gray' | 'green' | 'orange' | 'red' | 'blue' | 'purple'
}) {
  const tones: Record<string, string> = {
    gray: 'bg-track text-muted ring-border',
    green: 'bg-brand-soft text-brand-dark ring-brand/20',
    orange: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-600 ring-red-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/* --------------------------------------------------------------- Button */
type BtnProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
}: BtnProps) {
  const variants: Record<string, string> = {
    primary: 'bg-brand text-white shadow-sm hover:bg-brand-dark active:scale-[0.98]',
    secondary: 'bg-surface border border-border text-foreground hover:bg-subtle active:scale-[0.98]',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]',
    ghost: 'text-muted hover:bg-track hover:text-foreground',
  }
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

/* -------------------------------------------------------------- Spinner */
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-faint">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand" />
      {label}
    </div>
  )
}

/* ------------------------------------------------------------- Skeleton */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

/** A grid of skeleton cards for loading states. */
export function SkeletonGrid({ count = 8, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-4 md:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  )
}

/* ----------------------------------------------------------- EmptyState */
export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string
  hint?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 py-16 text-center">
      {icon && (
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="max-w-xs text-xs text-faint">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/* ----------------------------------------------------------- PageHeader */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

/* ------------------------------------------------------------- StatCard */
export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  hint,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: 'brand' | 'blue' | 'violet' | 'amber' | 'rose' | 'teal' | 'indigo'
  hint?: string
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-soft text-brand-dark',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    teal: 'bg-teal-50 text-teal-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  }
  return (
    <Card className="p-4" hover>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-faint">{hint}</p>}
    </Card>
  )
}

/* ---------------------------------------------------------------- Modal */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative z-10 w-full ${width} animate-pop-in rounded-2xl border border-border bg-surface shadow-pop`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-track hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Field */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-shadow placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20'
