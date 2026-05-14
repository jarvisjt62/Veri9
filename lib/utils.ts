import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'VERIFIED':        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'Verified Authentic' }
    case 'LIKELY_AUTHENTIC':return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'Likely Authentic' }
    case 'INSUFFICIENT_DATA':return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Insufficient Data' }
    case 'NOT_FOUND':       return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Product Not Found' }
    case 'SUSPICIOUS':      return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Suspicious Product' }
    default:                return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: status }
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'VERIFIED':         return 'fa-shield-alt'
    case 'LIKELY_AUTHENTIC': return 'fa-check-circle'
    case 'INSUFFICIENT_DATA':return 'fa-exclamation-triangle'
    case 'NOT_FOUND':        return 'fa-times-circle'
    case 'SUSPICIOUS':       return 'fa-exclamation-circle'
    default:                 return 'fa-question-circle'
  }
}

export function cleanBarcode(barcode: string) {
  return barcode.replace(/[\s-]/g, '')
}

export function isValidBarcode(barcode: string) {
  const clean = cleanBarcode(barcode)
  return /^\d{6,14}$/.test(clean)
}

export const SCAN_HISTORY_KEY = 'veri9_history'
export const REMEMBERED_EMAIL_KEY = 'veri9_remembered_email'

export function getScanHistory() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SCAN_HISTORY_KEY) || '[]')
  } catch { return [] }
}

export function saveScanToHistory(scan: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const history = getScanHistory()
  history.unshift(scan)
  if (history.length > 50) history.pop()
  localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history))
}