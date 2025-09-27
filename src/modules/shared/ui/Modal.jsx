import React from 'react';
export default function Modal({open, onClose, children}){
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-[min(900px,92vw)] max-h-[90vh] overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}