export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Logo SebelumTutup">
      <defs>
        <linearGradient id="sebelumtutup-mark" x1="12" x2="52" y1="10" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff5a36" />
          <stop offset="0.48" stopColor="#44d6a8" />
          <stop offset="1" stopColor="#46b4ff" />
        </linearGradient>
        <radialGradient id="sebelumtutup-glow" cx="50%" cy="0%" r="90%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#44d6a8" stopOpacity="0.08" />
          <stop offset="1" stopColor="#0d1016" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="64" height="64" rx="14" fill="#0d1016" />
      <rect x="3" y="3" width="58" height="58" rx="12" fill="url(#sebelumtutup-glow)" />
      <rect x="3.5" y="3.5" width="57" height="57" rx="11.5" fill="none" stroke="url(#sebelumtutup-mark)" strokeOpacity="0.45" />

      <path
        d="M17 18.5C17 14.9 19.9 12 23.5 12h17C48.5 12 52 15.5 52 23.5v8C52 39.5 48.5 43 40.5 43H34l-8.7 7.2c-1.3 1-3.3.1-3.3-1.6V43h-1.2C18.7 43 17 41.3 17 39.2V18.5Z"
        fill="#171b23"
        stroke="url(#sebelumtutup-mark)"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M23 23.5h18" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M23 32h10" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2.4" strokeLinecap="round" />

      <circle cx="41.5" cy="31.5" r="8.2" fill="#0d1016" stroke="#44d6a8" strokeWidth="2.4" />
      <path d="M41.5 26.8v5.2l3.6 2.7" stroke="#46b4ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30.5 41.3 42.2 20" stroke="#ff5a36" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46.8" cy="18.8" r="3" fill="#ff5a36" />
    </svg>
  );
}
