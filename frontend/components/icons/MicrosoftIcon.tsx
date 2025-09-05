import React from 'react';

export function MicrosoftIcon({
  className = 'w-5 h-5',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0.5" y="0.5" width="9" height="9" fill="#F25022" />
      <rect x="11.5" y="0.5" width="9" height="9" fill="#7FBA00" />
      <rect x="0.5" y="11.5" width="9" height="9" fill="#00A4EF" />
      <rect x="11.5" y="11.5" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
