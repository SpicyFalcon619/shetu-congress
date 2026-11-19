/** The Shetu mark: an arch over a deck, hangers between, a pier at the end. */
export function ArchLogo({
  className = "h-6 w-auto",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const arch = onDark ? "#FFFFFF" : "#BF092F";
  const deck = onDark ? "#F9DFE4" : "#222023";
  const hanger = onDark ? "#E58C9D" : "#F2B8C3";
  return (
    <svg viewBox="0 0 132 52" className={className} aria-hidden>
      <path d="M44 34V22M58 34V14M72 34V14M86 34V22" stroke={hanger} strokeWidth="3" />
      <path d="M18 36 Q66 -10 116 36" fill="none" stroke={arch} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M6 38H118" stroke={deck} strokeWidth="5" strokeLinecap="round" />
      <circle cx="121" cy="38" r="6" fill={arch} />
    </svg>
  );
}
