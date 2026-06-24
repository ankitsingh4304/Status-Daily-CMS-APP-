'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▥' },
  { href: '/content', label: 'Content', icon: '▦' },
  { href: '/categories', label: 'Categories', icon: '◫' },
  { href: '/languages', label: 'Languages', icon: '⒜' },
  { href: '/users', label: 'Users', icon: '☺' },
  { href: '/analytics', label: 'Analytics', icon: '◔' },
  { href: '/reports', label: 'Moderation', icon: '⚑' },
]

export function Sidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-black/5 bg-white">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          S
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold">Status Daily</p>
          <p className="text-[11px] text-gray-400">Master CMS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-orange-50 text-brand' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="w-4 text-center text-xs">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-black/5 p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-xs font-medium text-gray-700">{adminName}</p>
          <p className="text-[11px] text-gray-400">Administrator</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <span className="text-xs">⏻</span> Sign out
        </button>
      </div>
    </aside>
  )
}
