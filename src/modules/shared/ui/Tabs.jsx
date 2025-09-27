import React from 'react';

export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={()=>onChange(t.value)}
          className={`tab ${value===t.value ? 'tab-active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
