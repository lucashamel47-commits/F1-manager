/** Pictogramme « message » (bulle), trait fin façon Novex. */
export default function SupportIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a8 8 0 0 1-11.6 7.14L4 20.5l1.4-4.6A8 8 0 1 1 21 12z" />
      <path d="M8.5 10.5h7M8.5 13.5h4.5" />
    </svg>
  )
}
