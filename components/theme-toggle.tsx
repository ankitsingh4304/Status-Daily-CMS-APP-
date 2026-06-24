'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

/** Light/Dark toggle for the CMS. Persists to localStorage; the no-flash script
 *  in the root layout applies the saved theme before first paint. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('cms-theme', next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
    setDark(next)
  }

  return (
    <button
      onClick={toggle}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground"
    >
      {dark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
