import React from 'react';
import { Gender } from '../../domain/models/models';

const PALETTE = {
  [Gender.MALE]: { main: '#4ECB5E', shadow: '#3DA54B' },
  [Gender.FEMALE]: { main: '#A070EE', shadow: '#7F52C9' },
} as const;

/** Flat person badge: green for boys, purple for girls. */
export const StudentAvatar: React.FC<{ gender: Gender; size?: number; className?: string }> = ({ gender, size = 44, className = '' }) => {
  const c = PALETTE[gender] ?? PALETTE[Gender.MALE];
  const id = `sa-${gender}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="50" fill={c.main} />
      <g clipPath={`url(#${id})`} fill={c.shadow}>
        <polygon points="39.4,47.2 60.6,26 130.6,96 109.4,117.2" />
        <rect x="22.5" y="57.5" width="55" height="21" rx="10.5" />
        <polygon points="25.6,75.4 74.4,60.6 144.4,130.6 95.6,145.4" />
      </g>
      <circle cx="50" cy="36.6" r="15" fill="#fff" />
      <rect x="22.5" y="57.5" width="55" height="21" rx="10.5" fill="#fff" />
    </svg>
  );
};
