import React from 'react';

interface PrimeStarLogoProps {
  variant?: 'full' | 'compact' | 'light-bg' | 'dark-bg';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  height?: number | string;
  width?: number | string;
}

export const PrimeStarLogo: React.FC<PrimeStarLogoProps> = ({
  size = 'md',
  className = '',
  height,
  width,
}) => {
  const heightClasses = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  }[size];

  return (
    <div className={`inline-flex items-center justify-center bg-transparent ${className}`}>
      <img
        src="/assets/logo.svg"
        alt="Prime Star Consulting Services"
        className={`object-contain max-w-full bg-transparent ${height ? '' : heightClasses}`}
        style={{
          height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
          width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo.svg';
        }}
      />
    </div>
  );
};
