import React from 'react';

export default function Button({ children, variant='primary', className='', ...rest }) {
  const base = 'btn';
  const styles =
    variant === 'outline'
      ? 'btn-outline'
      : 'btn-primary';
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
