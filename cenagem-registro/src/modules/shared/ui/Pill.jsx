import React from 'react';
export default function Pill({active, children, ...props}){
  return (
    <button {...props} className={`px-3 py-1 rounded-full border text-sm transition ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
      {children}
    </button>
  );
}