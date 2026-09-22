export function Mascot({ size = 42, animate = false }: { size?: number; animate?: boolean }) {
  return <svg className={`mascot ${animate ? 'mascot-pulse' : ''}`} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M35 3C38 17 25 18 27 30c6-1 11-7 13-12 9 9 16 18 14 28C52 58 41 63 29 61 14 59 7 50 10 38 12 29 24 21 24 10c5 2 8 5 8 8 4-5 4-10 3-15Z" fill="currentColor" />
    <path d="M32 33c-1 8-9 9-9 16 0 6 5 9 10 9 8 0 13-7 10-13-1 4-4 6-7 5 3-6 0-11-4-17Z" fill="#c4b5fd" />
    <path d="M23 36h3m13-2h3" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
}

export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className="brand-logo" role="img" aria-label="StreakFlow"><Mascot size={36} />{!compact && <span>Streak<span className="brand-flow">Flow</span></span>}</span>
}
