import React from 'react';

export default React.forwardRef(function Select(
  { label, value, onChange, options=[], className='', ...rest }, ref
){
  const opts = options.map(o => typeof o==='string' ? {label:o, value:o} : o);
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-sm text-slate-700">{label}</span>}
      <select
        ref={ref}
        value={value ?? ''}
        onChange={onChange}
        className={`input ${className}`}
        {...rest}
      >
        <option value="">—</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
});
