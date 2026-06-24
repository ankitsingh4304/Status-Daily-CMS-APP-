import { prisma } from '@/lib/db'
import { ok } from '@/lib/api'

// App-facing: published categories for a given language (§5, §18).
// GET /api/app/categories?lang=hi
export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get('lang')

  const categories = await prisma.category.findMany({
    where: {
      isPublished: true,
      ...(lang ? { languages: { some: { code: lang } } } : {}),
    },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, key: true, name: true, iconUrl: true },
  })
  return ok(categories)
}
