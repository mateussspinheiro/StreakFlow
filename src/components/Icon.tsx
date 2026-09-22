import type { SVGProps } from 'react'

const paths = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  history: 'M3 11a9 9 0 1 1 2.5 7M3 4v7h7m2-4v5l3 2',
  profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
  flame: 'M12 3c1 4-2 5-2 8 0 1 1 2 2 2 2 0 3-2 3-4 3 3 4 5 4 7a7 7 0 0 1-14 0c0-5 5-6 7-13Z',
  target: 'M21 12a9 9 0 1 1-9-9m0 4a5 5 0 1 0 5 5m-5 0 9-9m-5 0h5v5',
  check: 'm5 12 4 4L19 6',
  chart: 'M4 4v16h16M8 16v-4m4 4V8m4 8V5',
} as const

export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>
}
