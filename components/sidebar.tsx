'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Images,
  LayoutGrid,
  Languages,
  Users,
  BarChart3,
  Flag,
  LogOut,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/content', label: 'Content', icon: Images },
  { href: '/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/languages', label: 'Languages', icon: Languages },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/reports', label: 'Moderation', icon: Flag },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Sidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-sm">
          <Sparkles size={18} strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">Status Daily</p>
          <p className="text-[11px] font-medium text-faint">Master CMS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-faint">
          Manage
        </p>
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-soft text-brand-dark'
                  : 'text-muted hover:bg-subtle hover:text-foreground'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
              )}
              <Icon size={18} strokeWidth={active ? 2.4 : 2} className={active ? 'text-brand' : ''} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Account */}
      <div className="border-t border-border p-3">
        <div className="mb-1 flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark">
            {initials(adminName)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold text-foreground">{adminName}</p>
            <p className="text-[11px] text-faint">Administrator</p>
          </div>
        </div>
        <ThemeToggle />
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground"
        >
          <LogOut size={17} strokeWidth={2} /> Sign out
        </button>
      </div>
    </aside>
  )
}
