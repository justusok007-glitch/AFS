import React from 'react';
import { UserRole } from '../../domain/models/models';

const THEME: Record<string, { bg: string; shadow: string; accent: string }> = {
  [UserRole.TEACHER]: { bg: '#4ECB5E', shadow: '#3DA54B', accent: '#2E8B3B' },
  [UserRole.ACCOUNTANT]: { bg: '#2BBBAD', shadow: '#1F968B', accent: '#177A70' },
  [UserRole.ADMIN]: { bg: '#8B6CF0', shadow: '#6F52CF', accent: '#5B3FB8' },
};

/** Faceless role badge (no eyes or nose): white figure with a small role emblem. */
export const RoleAvatar: React.FC<{ role: UserRole; size?: number; className?: string }> = ({ role, size = 62, className = '' }) => {
  const c = THEME[role] ?? THEME[UserRole.TEACHER];
  const id = `ra-${role}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="50" fill={c.bg} />
      <g clipPath={`url(#${id})`} fill={c.shadow}>
        <polygon points="25.6,80 74.4,65 144.4,135 95.6,150" />
      </g>
      <rect x="22" y="56" width="56" height="28" rx="13" fill="#fff" />
      <circle cx="50" cy="36" r="15" fill="#fff" />
      {role === UserRole.TEACHER && (
        <g fill={c.accent}>
          <path d="M34 68c5-3 11-3 16 1 5-4 11-4 16-1v12c-5-3-11-3-16 1-5-4-11-4-16-1z" />
        </g>
      )}
      {role === UserRole.ACCOUNTANT && (
        <g>
          <polygon points="46,58 54,58 56,66 50,82 44,66" fill={c.accent} />
          <circle cx="50" cy="72" r="0" />
        </g>
      )}
      {role === UserRole.ADMIN && (
        <g fill={c.accent}>
          <circle cx="50" cy="70" r="8" />
          <circle cx="50" cy="70" r="3.2" fill="#fff" />
          <path d="M48 59h4v4h-4zM48 77h4v4h-4zM39 68h4v4h-4zM57 68h4v4h-4z" />
        </g>
      )}
    </svg>
  );
};
