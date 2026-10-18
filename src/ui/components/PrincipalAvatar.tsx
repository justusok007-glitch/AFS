import React from 'react';

/** Faceless principal badge: mortarboard cap, white head, suit shoulders with a tie. */
export const PrincipalAvatar: React.FC<{ size?: number; className?: string }> = ({ size = 56, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={`shrink-0 ${className}`} aria-hidden="true">
    <defs>
      <clipPath id="pa-clip">
        <circle cx="50" cy="50" r="50" />
      </clipPath>
    </defs>
    <circle cx="50" cy="50" r="50" fill="#F2B544" />
    <g clipPath="url(#pa-clip)" fill="#D4952A">
      <polygon points="25.6,78 74.4,63 144.4,133 95.6,148" />
    </g>
    {/* shoulders */}
    <rect x="22" y="58" width="56" height="26" rx="12" fill="#fff" />
    {/* collar + tie */}
    <polygon points="42,58 50,68 58,58" fill="#E4E8F0" />
    <polygon points="47.5,66 52.5,66 54,72 50,84 46,72" fill="#14284B" />
    {/* head */}
    <circle cx="50" cy="42" r="13" fill="#fff" />
    {/* mortarboard */}
    <polygon points="50,16 76,26 50,36 24,26" fill="#14284B" />
    <path d="M38 33v7c0 3 24 3 24 0v-7l-12 4.6z" fill="#14284B" />
    <line x1="72" y1="28" x2="72" y2="40" stroke="#14284B" strokeWidth="2" />
    <circle cx="72" cy="42" r="2.4" fill="#14284B" />
  </svg>
);
