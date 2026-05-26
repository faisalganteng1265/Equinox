'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useTweaks<T extends Record<string, unknown>>(defaults: T): [T, (edits: Partial<T>) => void] {
  const [values, setValues] = useState<T>(defaults);
  const setTweak = useCallback((edits: Partial<T>) => {
    setValues(prev => ({ ...prev, ...edits }));
  }, []);
  return [values, setTweak];
}

function TweakRow({ label, value, children, inline = false }: {
  label: string;
  value?: string | number;
  children?: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

export function TweakSection({ label }: { label: string }) {
  return <div className="twk-sect">{label}</div>;
}

export function TweakRadio({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  const n = options.length;
  return (
    <TweakRow label={label}>
      <div role="radiogroup" className="twk-seg">
        <div className="twk-seg-thumb" style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`, width: `calc((100% - 4px) / ${n})` }} />
        {options.map(o => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

export function TweakSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </TweakRow>
  );
}

export function TweakColor({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const isLight = (hex: string) => {
    const h = hex.replace('#', '');
    const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
    const n = parseInt(x.slice(0, 6), 16);
    if (Number.isNaN(n)) return true;
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return r * 299 + g * 587 + b * 114 > 148000;
  };
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const on = o.toLowerCase() === value.toLowerCase();
          return (
            <button key={i} type="button" className="twk-chip" role="radio" aria-checked={on} data-on={on ? '1' : '0'}
              style={{ background: o }} onClick={() => onChange(o)}>
              {on && (
                <svg viewBox="0 0 14 14" aria-hidden="true" style={{ position: 'absolute', top: 6, left: 6, width: 13, height: 13 }}>
                  <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    stroke={isLight(o) ? 'rgba(0,0,0,.78)' : '#fff'} />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

export function TweaksPanel({ title = 'Tweaks', children }: { title?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState({ x: 16, y: 16 });
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(offset);
  const PAD = 16;

  const clampToViewport = useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
    setOffset(offsetRef.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    clampToViewport();
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  const onDragStart = (e: React.MouseEvent) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev: MouseEvent) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <>
      {/* Tweaks toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', right: 16, bottom: open ? 'auto' : 16,
          top: open ? 'auto' : 'auto',
          zIndex: 2147483647,
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'var(--accent)',
          border: 'none',
          cursor: 'pointer',
          display: open ? 'none' : 'grid',
          placeItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          color: 'var(--accent-fg)',
        }}
        title="Open tweaks"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" /><path d="M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6l1.4 1.4 M17 17l1.4 1.4 M5.6 18.4 7 17 M17 7l1.4-1.4" />
        </svg>
      </button>

      {open && (
        <div ref={dragRef} className="twk-panel" style={{ right: offset.x, bottom: offset.y }}>
          <div className="twk-hd" onMouseDown={onDragStart}>
            <b>{title}</b>
            <button className="twk-x" aria-label="Close tweaks" onMouseDown={e => e.stopPropagation()} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="twk-body">
            {children}
          </div>
        </div>
      )}
    </>
  );
}
