'use client';

import { useState, useId, useRef, useEffect } from 'react';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  size = 220,
  thickness = 22,
  centerLabel,
  centerSub,
}: {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
  accentColor?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const r = size / 2 - thickness / 2 - 2;
  const cx = size / 2, cy = size / 2;
  const total = data.reduce((s, d) => s + d.value, 0);
  const segs = data.reduce<Array<DonutSegment & { start: number; end: number; idx: number; acc: number }>>((items, d, i) => {
    const acc = items[i - 1]?.acc ?? 0;
    const nextAcc = acc + d.value;
    return [
      ...items,
      {
        ...d,
        start: (acc / total) * Math.PI * 2 - Math.PI / 2,
        end: (nextAcc / total) * Math.PI * 2 - Math.PI / 2,
        idx: i,
        acc: nextAcc,
      },
    ];
  }, []);
  const arc = (start: number, end: number) => {
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        {segs.map((s, i) => (
          <path key={i}
            d={arc(s.start, s.end)}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
            style={{
              opacity: hover === null || hover === i ? 1 : 0.35,
              transition: 'opacity 200ms ease, stroke-width 180ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center' }}>
        <div>
          {hover !== null ? (
            <>
              <div className="num" style={{ fontSize: 28, fontWeight: 500 }}>{Math.round(segs[hover].value / total * 100)}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>{segs[hover].label}</div>
            </>
          ) : (
            <>
              <div className="display" style={{ fontSize: 32, fontStyle: 'italic', color: 'var(--text)' }}>{centerLabel}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{centerSub}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AreaChart({
  series,
  height = 200,
  color = 'var(--accent)',
  showAxis = true,
}: {
  series: { t: number; v: number }[];
  height?: number;
  color?: string;
  showAxis?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      setW(entries[0].contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const padL = showAxis ? 44 : 4, padR = 8, padT = 10, padB = showAxis ? 24 : 4;
  const innerW = Math.max(50, w - padL - padR);
  const innerH = height - padT - padB;
  const vals = series.map(s => s.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const x = (i: number) => padL + (i / (series.length - 1)) * innerW;
  const y = (v: number) => padT + (1 - (v - min) / range) * innerH;
  const linePath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s.v)}`).join(' ');
  const areaPath = `${linePath} L ${x(series.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  const gridLines = 4;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const idx = Math.round(((px - padL) / innerW) * (series.length - 1));
    if (idx >= 0 && idx < series.length) setHover(idx);
  };

  return (
    <div ref={wrapRef} style={{ width: '100%', position: 'relative' }}>
      <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showAxis && Array.from({ length: gridLines + 1 }, (_, i) => {
          const yy = padT + (i / gridLines) * innerH;
          const v = max - (i / gridLines) * range;
          return (
            <g key={i}>
              <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--border-soft)" strokeDasharray="2 4" />
              <text x={padL - 6} y={yy + 3} fontSize="10" fill="var(--text-dim)" textAnchor="end" fontFamily="var(--font-mono)">
                ${(v / 1000).toFixed(1)}k
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#area-grad)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" />
        {hover !== null && (
          <g>
            <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + innerH} stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
            <circle cx={x(hover)} cy={y(series[hover].v)} r="4" fill="var(--surface)" stroke={color} strokeWidth="1.8" />
          </g>
        )}
        {showAxis && (() => {
          const labels = [0, Math.floor(series.length / 2), series.length - 1];
          return labels.map(i => (
            <text key={i} x={x(i)} y={height - 6} fontSize="10" fill="var(--text-dim)" textAnchor="middle" fontFamily="var(--font-mono)">
              {i === 0 ? '30d ago' : i === series.length - 1 ? 'today' : '15d'}
            </text>
          ));
        })()}
      </svg>
      {hover !== null && (
        <div style={{
          position: 'absolute',
          left: Math.min(w - 140, Math.max(0, x(hover) - 70)),
          top: y(series[hover].v) - 56,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '8px 10px',
          fontSize: 12,
          pointerEvents: 'none',
          boxShadow: 'var(--shadow-sm)',
          whiteSpace: 'nowrap',
        }}>
          <div className="dim" style={{ fontSize: 10, marginBottom: 2 }}>Day {hover + 1}</div>
          <div className="num" style={{ fontWeight: 500 }}>${series[hover].v.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      )}
    </div>
  );
}

export function Sparkline({
  data,
  color,
  height = 28,
  width = 80,
  fill = true,
}: {
  data: number[];
  color: string;
  height?: number;
  width?: number;
  fill?: boolean;
}) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const xi = (i: number) => (i / (data.length - 1)) * width;
  const yi = (v: number) => height - 2 - ((v - min) / range) * (height - 4);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xi(i).toFixed(2)} ${yi(v).toFixed(2)}`).join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const id = `spk-${useId().replace(/:/g, '')}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AllocationBar({ data, height = 10 }: { data: { label: string; value: number; color: string }[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ display: 'flex', width: '100%', height, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-3)' }}>
      {data.map((d, i) => (
        <div key={i} title={`${d.label} ${(d.value / total * 100).toFixed(1)}%`} style={{
          width: `${(d.value / total) * 100}%`,
          background: d.color,
          transition: 'width 600ms cubic-bezier(.2,.7,.2,1)',
        }} />
      ))}
    </div>
  );
}
