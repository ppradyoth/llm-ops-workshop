export default function Logo({ className = "h-8 w-8" }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 5C8 3.34315 9.34315 2 11 2H27L37 12V40C37 41.6569 35.6569 43 34 43H11C9.34315 43 8 41.6569 8 40V5Z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M27 2.5V11C27 11.5523 27.4477 12 28 12H36.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="14" y1="20" x2="31" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="26" x2="26" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="32" x2="29" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
