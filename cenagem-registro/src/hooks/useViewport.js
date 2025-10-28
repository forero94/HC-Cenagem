import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function useViewport({ width, height }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panOrigin = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const viewBox = useMemo(() => {
    const w = width / zoom, h = height / zoom;
    const x = -pan.x / zoom, y = -pan.y / zoom;
    return `${x} ${y} ${w} ${h}`;
  }, [zoom, pan, width, height]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const d = -Math.sign(e.deltaY) * 0.1;
    setZoom((z) => Math.min(3, Math.max(0.3, +(z + d).toFixed(2))));
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panOrigin.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panOrigin.current.x, y: e.clientY - panOrigin.current.y });
  }, [isPanning]);

  const onMouseUp = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const enterFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (el && !document.fullscreenElement && el.requestFullscreen) el.requestFullscreen();
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.(); else enterFullscreen();
  }, [enterFullscreen]);

  const fit = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const downloadSVG = useCallback((filename = 'pedigree.svg') => {
    const svg = svgRef.current; if (!svg) return;
    const ser = new XMLSerializer(); const src = ser.serializeToString(svg);
    const blob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }, []);
  const downloadPNG = useCallback((filename = 'pedigree.png') => {
    const svg = svgRef.current; if (!svg) return;
    const ser = new XMLSerializer(); const src = ser.serializeToString(svg);
    const img = new Image(); const svgBlob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1024, svg.viewBox.baseVal.width);
      canvas.height = Math.max(768, svg.viewBox.baseVal.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => {
        const a = document.createElement('a'); const u2 = URL.createObjectURL(b);
        a.href = u2; a.download = filename; a.click(); URL.revokeObjectURL(u2);
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '+') setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)));
      if (e.key === '-') setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)));
      if (e.key.toLowerCase() === 'f') toggleFullscreen();
      if (e.key.toLowerCase() === 'r') fit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleFullscreen, fit]);

  return {
    containerRef, svgRef, viewBox, zoom, setZoom, pan, setPan,
    onMouseDown, onMouseMove, onMouseUp, toggleFullscreen, fit, downloadSVG, downloadPNG,
  };
}
