import React from 'react';

export interface SchoolLogoProps {
  size?: number;
  className?: string;
  adaptiveLauncher?: boolean;
}

/**
 * Displays the official Al Furqan School Okara PNG artwork exactly as provided,
 * preserving the original colors and embedded Arabic calligraphy via an <img> tag.
 */
export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  size = 44,
  className = '',
  adaptiveLauncher = false,
}) => {
  if (adaptiveLauncher) {
    return (
      <img
        src="/school-launcher-icon.png"
        alt="Al Furqan School Okara Logo"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`object-contain select-none ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}school-logo.png`}
      alt="Al Furqan School Okara Logo"
      width={size}
      height={Math.round(size * 0.84)}
      style={{ width: size, height: 'auto', maxHeight: size }}
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
};
