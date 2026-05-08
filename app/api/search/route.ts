import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const type = searchParams.get('type') || 'all'

  if (!q) {
    return NextResponse.json({ success: false, error: 'Search query is required (?q=)' }, { status: 400 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const openFoodFacts = require('@/lib/api/openFoodFacts')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const openFDA = require('@/lib/api/openFDA')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const openBeautyFacts = require('@/lib/api/openBeautyFacts')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const upcItemDb = require('@/lib/api/upcItemDb')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const openLibrary = require('@/lib/api/openLibrary')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const datakick = require('@/lib/api/datakick')

    const results: unknown[] = []

    if (type === 'food' || type === 'all') {
      const foodResults = await openFoodFacts.searchByName(q)
      results.push(...foodResults.map((r: unknown) => ({ ...(r as object), sourceType: 'food' })))
    }
    if (type === 'drug' || type === 'all') {
      const drugResult = await openFDA.searchByName(q)
      if (drugResult?.found) {
        results.push({ name: drugResult.brandName, brand: drugResult.brandName, sourceType: 'drug' })
      }
    }
    if (type === 'beauty' || type === 'all') {
      const beautyResults = await openBeautyFacts.searchByName(q)
      results.push(...beautyResults.map((r: unknown) => ({ ...(r as object), sourceType: 'beauty' })))
    }
    if (type === 'retail' || type === 'all') {
      const upcResults = await upcItemDb.searchByName(q)
      results.push(...upcResults.map((r: unknown) => ({ ...(r as object), sourceType: 'retail' })))
    }
    if (type === 'book' || type === 'all') {
      const bookResults = await openLibrary.searchByName(q)
      results.push(...bookResults.map((r: unknown) => ({ ...(r as object), sourceType: 'book' })))
    }
    if (type === 'grocery' || type === 'all') {
      const groceryResults = await datakick.searchByName(q)
      results.push(...groceryResults.map((r: unknown) => ({ ...(r as object), sourceType: 'grocery' })))
    }

    return NextResponse.json({ success: true, query: q, type, count: results.length, data: results })
  } catch (error) {
    console.error('[SEARCH] Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}