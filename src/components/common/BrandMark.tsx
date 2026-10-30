interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 22 }: BrandMarkProps) {
  return <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="28" height="28" rx="7" fill="currentColor" />
    <path d="M9 23V9l7 8 7-8v14" stroke="var(--mark-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 8v16" stroke="var(--mark-ink)" strokeWidth="1" opacity="0.5" />
  </svg>;
}
