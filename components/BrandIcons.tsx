// Inline marks rather than fetched images: they paint with the row, scale cleanly at
// 16px, inherit currentColor, and keep the CSP img-src on 'self'.

type Props = { className?: string };

const base = "size-4 shrink-0";

export function GitHubMark({ className = base }: Props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden focusable="false">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function VercelMark({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false">
      <path d="M12 2.5 22.5 21H1.5L12 2.5Z" />
    </svg>
  );
}

// The local-apps dashboard mark: 4 linked nodes. Drawn monochrome so it stays
// readable at the same size as the other marks in the row.
export function LocalAppsMark({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden focusable="false">
      <path d="M9 6.5h6M6.5 9v6M17.5 9v6M9 17.5h6" strokeLinecap="round" />
      <rect x="2.5" y="2.5" width="8" height="8" rx="2.4" />
      <rect x="13.5" y="2.5" width="8" height="8" rx="2.4" />
      <rect x="2.5" y="13.5" width="8" height="8" rx="2.4" />
      <rect x="13.5" y="13.5" width="8" height="8" rx="2.4" />
    </svg>
  );
}

export function ChromeMark({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path fill="#EA4335" d="M12 2a10 10 0 0 1 8.66 5H12a5 5 0 0 0-4.33 2.5L3.34 6.34A9.98 9.98 0 0 1 12 2Z" />
      <path fill="#FBBC05" d="M3.34 6.34 7.67 9.5a5 5 0 0 0 0 5L3.34 17.66a9.98 9.98 0 0 1 0-11.32Z" />
      <path fill="#34A853" d="M3.34 17.66 7.67 14.5A5 5 0 0 0 12 17h8.66A10 10 0 0 1 3.34 17.66Z" />
      <circle cx="12" cy="12" r="5" fill="#fff" />
      <circle cx="12" cy="12" r="3.9" fill="#4285F4" />
    </svg>
  );
}

export function AppleMark({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false">
      <path d="M17.05 12.54c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.79-.41 6.92 1.16 9.19.77 1.11 1.68 2.35 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.79.75 3.01.72c1.24-.02 2.03-1.13 2.79-2.24.88-1.28 1.24-2.53 1.26-2.59-.03-.01-2.42-.93-2.44-3.68M14.9 5.6c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.03.08 2.07-.52 2.71-1.29" />
    </svg>
  );
}

// Full-colour brand mark, used once at a larger size in the app type selector.
export function NextMark({ className = "size-4 shrink-0" }: Props) {
  return (
    <svg viewBox="0 0 180 180" className={className} aria-hidden focusable="false">
      <mask id="nextjs-mark" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
        <circle cx="90" cy="90" r="90" fill="black" />
      </mask>
      <g mask="url(#nextjs-mark)">
        <circle cx="90" cy="90" r="90" fill="currentColor" />
        <path d="M149.508 157.52 69.142 54H54v71.97h12.114V69.384l73.885 95.461a90.3 90.3 0 0 0 9.509-7.325Z" fill="url(#nextjs-arrow)" />
        <rect x="115" y="54" width="12" height="72" fill="url(#nextjs-bar)" />
      </g>
      <defs>
        <linearGradient id="nextjs-arrow" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--nextjs-ink)" />
          <stop offset="1" stopColor="var(--nextjs-ink)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nextjs-bar" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--nextjs-ink)" />
          <stop offset="1" stopColor="var(--nextjs-ink)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
