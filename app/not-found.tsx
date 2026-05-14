import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 500 }}>
        <h1 style={{
          fontSize: 'clamp(4rem, 12vw, 8rem)',
          fontWeight: 900,
          color: '#635bff',
          lineHeight: 1,
          marginBottom: 16,
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: 12,
        }}>
          Page Not Found
        </h2>
        <p style={{
          fontSize: '1rem',
          color: '#64748b',
          lineHeight: 1.7,
          marginBottom: 32,
        }}>
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#635bff',
            color: '#fff',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '1rem',
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}