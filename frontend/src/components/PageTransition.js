import React, { useState, useEffect } from 'react';

export function PageTransition({ children }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`page-enter ${isVisible ? 'page-enter-active' : ''}`}>
      {children}
    </div>
  );
}

export function Skeleton({ variant = 'text', width, height, className = '' }) {
  const baseClass = 'skeleton';
  const variantClass = variant === 'kpi' ? 'skeleton-kpi' :
                       variant === 'card' ? 'skeleton-card' :
                       variant === 'avatar' ? 'skeleton-avatar' :
                       variant === 'badge' ? 'skeleton-badge' :
                       variant === 'table-row' ? 'skeleton-table-row' :
                       variant === 'title' ? 'skeleton-title' :
                       `skeleton-text ${width ? 'skeleton-text-' + width : ''}`;

  const style = {
    ...(height ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...(width && !width.startsWith('skeleton-text') ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
  };

  return <div className={`${baseClass} ${variantClass} ${className}`} style={style} />;
}

export function CountUp({ end, duration = 1200, suffix = '' }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (end === null || end === undefined || isNaN(end)) {
      setValue(end ?? 0);
      return;
    }

    let startTime = null;
    const startVal = 0;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(startVal + (end - startVal) * eased));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    };

    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return (
    <span className="counter-value">
      {typeof end === 'number' && end >= 1000 ? value.toLocaleString() : value}{suffix}
    </span>
  );
}