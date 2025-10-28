export const yearsSince = iso => {
    if(!iso) return '—'; const d=new Date(iso); if(Number.isNaN(d.getTime())) return '—';
    const n=new Date(); let y=n.getFullYear()-d.getFullYear();
    const m=n.getMonth()-d.getMonth(); if(m<0||(m===0&&n.getDate()<d.getDate())) y--; return `${y}a`;
    };
    
    
    export const sexShape = s => s==='M' ? 'square' : s==='F' ? 'circle' : 'diamond';