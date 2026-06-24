import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar adminName={session.name} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
