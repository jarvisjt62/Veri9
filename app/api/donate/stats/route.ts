import { NextResponse } from 'next/server'
import { getAllDonations } from '@/lib/integrations-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/donate/stats
 *
 * Public endpoint — returns aggregated donation statistics for the
 * social-proof banner on the /donate page. No auth required.
 */
export async function GET() {
  try {
    const donations = await getAllDonations()

    // Count only completed donations for stats
    const completed = donations.filter(d => d.status === 'completed')

    const totalSupporters = completed.filter(d => !d.anonymous || d.name).length
    const totalCompleted = completed.length
    const totalUsd = completed.reduce((sum, d) => {
      const usd = parseFloat(d.usdEquivalent)
      return sum + (isNaN(usd) ? 0 : usd)
    }, 0)

    // Recent non-anonymous donors (last 5, newest first)
    const recentDonors = completed
      .filter(d => !d.anonymous && d.name)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(d => ({
        name: d.name.length > 20 ? d.name.slice(0, 18) + '…' : d.name,
        amount: d.amount,
        currency: d.currency,
        when: timeAgo(new Date(d.createdAt)),
      }))

    // Monthly recurring supporters
    const recurringCount = completed.filter(d => d.recurring).length

    return NextResponse.json({
      success: true,
      totalSupporters,
      totalCompleted,
      totalUsd: totalUsd.toFixed(0),
      recentDonors,
      recurringCount,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
