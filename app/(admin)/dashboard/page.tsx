'use client'

import Link from 'next/link'
import {
  Users as UsersIcon,
  Crown,
  Activity,
  Share2,
  LayoutGrid,
  Images,
  Trophy,
  Languages as LanguagesIcon,
  ArrowRight,
} from 'lucide-react'
import { useApi } from '@/hooks/use-api'
import { Card, PageHeader, SkeletonGrid, StatCard } from '@/components/ui'
import { compactNumber } from '@/lib/format'

type Stats = {
  totalUsers: number
  premiumUsers: number
  activeUsers: number
  totalShares: number
  totalCategories: number
  totalContent: number
  topCategory: string
  topLanguage: string
}

export default function DashboardPage() {
  const { data, loading } = useApi<Stats>('/api/admin/dashboard')

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" subtitle="Overview of Status Daily activity" />

      {loading || !data ? (
        <SkeletonGrid count={8} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Users" value={compactNumber(data.totalUsers)} tone="blue" icon={<UsersIcon size={16} />} />
            <StatCard label="Premium Users" value={compactNumber(data.premiumUsers)} tone="violet" icon={<Crown size={16} />} />
            <StatCard label="Active Users (30d)" value={compactNumber(data.activeUsers)} tone="brand" icon={<Activity size={16} />} />
            <StatCard label="Total Shares" value={compactNumber(data.totalShares)} tone="teal" icon={<Share2 size={16} />} />
            <StatCard label="Categories" value={String(data.totalCategories)} tone="amber" icon={<LayoutGrid size={16} />} />
            <StatCard label="Uploaded Content" value={compactNumber(data.totalContent)} tone="indigo" icon={<Images size={16} />} />
            <StatCard label="Top Category" value={data.topCategory} tone="rose" icon={<Trophy size={16} />} />
            <StatCard label="Top Language" value={data.topLanguage} tone="brand" icon={<LanguagesIcon size={16} />} />
          </div>

          <h2 className="mb-3 mt-9 text-sm font-semibold text-foreground">Quick actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <QuickLink href="/content" title="Manage Content" desc="Upload, publish & organize templates" icon={<Images size={18} />} />
            <QuickLink href="/categories" title="Manage Categories" desc="Create categories & map languages" icon={<LayoutGrid size={18} />} />
            <QuickLink href="/reports" title="Moderation Queue" desc="Review reported content" icon={<Activity size={18} />} />
          </div>
        </>
      )}
    </div>
  )
}

function QuickLink({
  href,
  title,
  desc,
  icon,
}: {
  href: string
  title: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <Link href={href}>
      <Card className="group p-5" hover>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            {icon}
          </span>
          <div className="flex-1">
            <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
              {title}
              <ArrowRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
            <p className="mt-0.5 text-xs text-muted">{desc}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
