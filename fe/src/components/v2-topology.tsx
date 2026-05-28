'use client';

import { useMemo, useState } from 'react';
import { Icon } from './icons';
import type { Asset, Venue } from '@/lib/data';

interface VenueNode {
  id: string;
  label: string;
  shortLabel: string;
  asset: string;
  apy: number;
  kind: string;
  x: number;
  y: number;
  weight: number;
  color: string;
}

function kindColor(kind: string): string {
  if (kind.includes('Idle')) return 'var(--warning)';
  if (kind.includes('CeFi')) return 'var(--info)';
  return 'var(--accent)';
}

function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function shortVenueLabel(label: string): string {
  const withoutAdapter = label.replace(/\s+Adapter$/i, '').trim();
  return withoutAdapter.length > 18 ? `${withoutAdapter.slice(0, 18)}...` : withoutAdapter;
}

export function CapitalTopology({
  assets,
  venues = [],
  onRefresh,
  refreshing = false,
  profile,
  paused,
}: {
  assets: Asset[];
  venues?: Venue[];
  onRefresh: () => void;
  refreshing?: boolean;
  profile: string;
  paused: boolean;
}) {
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const W = 1200;
  const H = 320;
  const VAULT = { x: 80, y: H / 2 };
  const HUB = { x: 320, y: H / 2 };

  const venueNodes: VenueNode[] = useMemo(() => {
    const source = venues.length > 0
      ? venues
      : assets.map((asset) => ({
          name: asset.venue,
          kind: asset.venueKind,
          chain: 'Mantle Sepolia',
          asset: asset.id,
          apy: asset.apy,
          tvl: '',
          state: 'active' as const,
        }));

    return source.map((venue, index) => {
      const rowCount = Math.max(1, source.length);
      const y = 58 + (index * (H - 116)) / Math.max(1, rowCount - 1);
      const a = assets.find((asset) => asset.id === venue.asset || asset.sym === venue.asset);
      const kind = venue.kind || 'Strategy';
      return {
        id: `${venue.name}-${index}`,
        label: venue.name,
        shortLabel: shortVenueLabel(venue.name),
        asset: a?.id || venue.asset,
        apy: venue.apy,
        kind,
        x: 900,
        y,
        weight: a ? a.weight : 0,
        color: kindColor(kind),
      };
    });
  }, [assets, venues]);

  return (
    <div className="topology" style={{ height: 360 }}>
      <div className="topology-grid" />

      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 18,
          right: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 5,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="live-dot" />
          <span className="eyebrow" style={{ color: 'var(--paper-2)' }}>Capital Topology</span>
          <span className="eyebrow dim">| live | {profile} bounds</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-outline" onClick={onRefresh} disabled={refreshing} type="button">
            <Icon name="swap" size={12} /> {refreshing ? 'Refreshing...' : 'Refresh state'}
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g>
          <path d={`M ${VAULT.x + 28} ${VAULT.y} L ${HUB.x - 32} ${HUB.y}`} fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.65" />
          <path
            d={`M ${VAULT.x + 28} ${VAULT.y} L ${HUB.x - 32} ${HUB.y}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1"
            strokeDasharray="4 6"
            style={{ animation: paused ? 'none' : 'dash-flow 1.4s linear infinite' }}
          />
        </g>

        {venueNodes.map((v) => {
          const strength = Math.max(0.2, v.weight * 2.5);
          const stroke = v.weight > 0 ? 'var(--accent)' : 'var(--rule)';
          return (
            <g key={v.id} opacity={hoverNode && hoverNode !== v.id ? 0.4 : 1} style={{ transition: 'opacity 200ms' }}>
              <path d={curvePath(HUB.x + 32, HUB.y, v.x - 72, v.y)} fill="none" stroke={stroke} strokeWidth={strength} opacity="0.5" />
              {v.weight > 0 && (
                <path
                  d={curvePath(HUB.x + 32, HUB.y, v.x - 72, v.y)}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1"
                  strokeDasharray="3 6"
                  style={{ animation: paused ? 'none' : 'dash-flow 1.8s linear infinite' }}
                />
              )}
            </g>
          );
        })}

        <g style={{ cursor: 'pointer' }} onMouseEnter={() => setHoverNode('vault')} onMouseLeave={() => setHoverNode(null)}>
          <rect
            x={VAULT.x - 30}
            y={VAULT.y - 24}
            width="60"
            height="48"
            rx="6"
            fill="var(--ink-3)"
            stroke={hoverNode === 'vault' ? 'var(--accent)' : 'var(--paper-3)'}
            strokeWidth="1"
          />
          <text x={VAULT.x} y={VAULT.y - 4} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--paper-3)" letterSpacing="0.06em">VAULT</text>
          <text x={VAULT.x} y={VAULT.y + 10} textAnchor="middle" fontSize="11" fontFamily="var(--font-display)" fontStyle="italic" fill="var(--paper)">Your</text>
          <text x={VAULT.x} y={VAULT.y + 20} textAnchor="middle" fontSize="11" fontFamily="var(--font-display)" fontStyle="italic" fill="var(--paper)">capital</text>
        </g>

        <g style={{ cursor: 'pointer' }} onMouseEnter={() => setHoverNode('agent')} onMouseLeave={() => setHoverNode(null)}>
          {!paused && (
            <circle cx={HUB.x} cy={HUB.y} r="46" fill="none" stroke="var(--accent)" strokeWidth="0.8" opacity="0.4">
              <animate attributeName="r" values="38;52;38" dur="3.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.55;0.05;0.55" dur="3.4s" repeatCount="indefinite" />
            </circle>
          )}
          <circle cx={HUB.x} cy={HUB.y} r="32" fill="var(--ink-3)" stroke="var(--accent)" strokeWidth="1.4" />
          <circle cx={HUB.x} cy={HUB.y} r="22" fill="none" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" />
          <circle cx={HUB.x} cy={HUB.y} r="3" fill="var(--accent)" />
          <text x={HUB.x} y={HUB.y - 40} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--paper-2)" letterSpacing="0.08em">AGENT</text>
          <text x={HUB.x} y={HUB.y + 50} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--paper-3)">LIVE</text>
        </g>

        {venueNodes.map((v) => {
          const active = v.weight > 0;
          const w = 176;
          const h = 58;
          const hover = hoverNode === v.id;
          return (
            <g key={v.id} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoverNode(v.id)} onMouseLeave={() => setHoverNode(null)}>
              <rect
                x={v.x - w / 2}
                y={v.y - h / 2}
                width={w}
                height={h}
                rx="6"
                fill="var(--ink-3)"
                stroke={hover ? v.color : active ? v.color : 'var(--rule)'}
                strokeWidth="1"
                opacity={active ? 1 : 0.6}
              />
              {active && <rect x={v.x - w / 2} y={v.y - h / 2} width="3" height={h} fill={v.color} rx="1" />}
              <text x={v.x - w / 2 + 12} y={v.y - 8} fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--paper-3)" letterSpacing="0.08em">
                {v.kind.toUpperCase()} | {v.asset}
              </text>
              <text x={v.x - w / 2 + 12} y={v.y + 8} fontSize="12.5" fontFamily="var(--font-ui)" fontWeight="500" fill="var(--paper)">
                {v.shortLabel}
              </text>
              <text x={v.x - w / 2 + 12} y={v.y + 23} fontSize="11" fontFamily="var(--font-mono)" fill={v.color}>
                {v.apy.toFixed(2)}%
              </text>
            </g>
          );
        })}
      </svg>

      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 18,
          right: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--paper-3)',
          fontFamily: 'var(--font-mono)',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Legend dot="var(--accent)" label="DeFi | Mantle" />
          <Legend dot="var(--warning)" label="Idle strategy" />
          <Legend dot="var(--info)" label="CeFi strategy" />
        </div>
        <div className="dim">{paused ? 'paused' : 'live backend snapshot'}</div>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
      {label}
    </span>
  );
}
