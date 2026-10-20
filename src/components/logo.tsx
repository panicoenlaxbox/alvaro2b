/** The app's die, as in the home-screen icon. */
export function LogoDie({ className = "size-9" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className}>
      <rect x="6" y="6" width="31" height="31" rx="7" fill="#0f0d18" />
      <rect x="3" y="3" width="31" height="31" rx="7" fill="#ef6f4c" stroke="#0f0d18" strokeWidth="3" />
      <circle cx="11.5" cy="11.5" r="2.8" fill="#f6f1e7" />
      <circle cx="18.5" cy="18.5" r="2.8" fill="#f6f1e7" />
      <circle cx="25.5" cy="25.5" r="2.8" fill="#f6f1e7" />
    </svg>
  );
}
