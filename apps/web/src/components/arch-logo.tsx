/** The Shetu mark: a crimson arch over an ink deck, rose hangers, a crimson pier. */
export function ArchLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 132 52" className={className} aria-hidden>
      <path d="M44 34V22M58 34V14M72 34V14M86 34V22" stroke="#F2B8C3" strokeWidth="3" />
      <path d="M18 36 Q66 -10 116 36" fill="none" stroke="#BF092F" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M6 38H118" stroke="#222023" strokeWidth="5" strokeLinecap="round" />
      <circle cx="121" cy="38" r="6" fill="#BF092F" />
    </svg>
  );
}
