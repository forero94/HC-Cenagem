import React from 'react';

export default React.forwardRef(function TextInput(
  { label, value, onChange, type='text', className='', placeholder, ...rest }, ref
){
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-sm text-slate-700">{label}</span>}
      <input
        ref={ref}
        type={type}
        value={value ?? ''}
        onChange={(e)=>onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`input ${className}`}
        {...rest}
      />
    </label>
  );
});
