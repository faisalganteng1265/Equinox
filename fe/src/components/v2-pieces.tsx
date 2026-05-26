'use client';

import { useMemo } from 'react';
import { Icon } from './icons';
import type { Asset, FeedEntry, RiskProfiles } from '@/lib/data';

export function BottleCard({ asset }: { asset: Asset }) {
  const fillPct = Math.min(100, asset.weight * 100);
  const usd = asset.balance * asset.price;
  return (
    <div className="bottle">
      {/* Liquid fill */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: `${fillPct}%`,
        background: `linear-gradient(180deg,
          color-mix(in srgb, ${asset.color} 25%, transparent),
          color-mix(in srgb, ${asset.color} 10%, transparent))`,
        borderTop: `1px solid color-mix(in srgb, ${asset.color} 45%, transparent)`,
        transition: 'height 800ms cubic-bezier(.2,.7,.2,1)',
      }} />

      {/* Side rule */}
      <div style={{
        position: 'absolute', left: 8, top: 0, bottom: 0, width: 4,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        paddingBlock: '8px',
      }}>
        {[100, 75, 50, 25, 0].map(n => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 4, height: 1, background: 'var(--paper-4)' }} />
            <span className="mono dim" style={{ fontSize: 8, opacity: 0.6 }}>{n}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ position: 'relative', padding: '16px 16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <div>
            <div className="display italic" style={{ fontSize: 24, lineHeight: 1, color: 'var(--paper)' }}>{asset.sym}</div>
            <div className="eyebrow" style={{ marginTop: 4 }}>{asset.kind}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{
              padding: '2px 7px', borderRadius: 999,
              fontSize: 10, fontFamily: 'var(--font-mono)',
              border: `1px solid color-mix(in srgb, ${asset.color} 35%, transparent)`,
              color: asset.color,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              {asset.venueKind}
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{ position: 'relative', padding: '12px 16px 14px' }}>
        <div className="eyebrow" style={{ color: 'var(--paper-2)' }}>Net APY</div>
        <div className="display italic" style={{
          fontSize: 36, lineHeight: 1, color: asset.color, marginTop: 4,
          letterSpacing: '-0.02em',
        }}>
          {asset.apy.toFixed(2)}<span style={{ fontSize: 18, color: 'var(--paper-3)', fontFamily: 'var(--font-ui)', fontStyle: 'normal' }}>%</span>
        </div>

        <div className="rule" style={{ margin: '12px 0 10px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="mono" style={{ fontSize: 13, color: 'var(--paper)', fontWeight: 500 }}>
              {(asset.weight * 100).toFixed(1)}%
            </div>
            <div className="eyebrow" style={{ marginTop: 2 }}>allocation</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 13, color: 'var(--paper-2)' }}>
              ${(usd / 1000).toFixed(1)}k
            </div>
            <div className="eyebrow" style={{ marginTop: 2 }}>
              {asset.balance.toLocaleString(undefined, { maximumFractionDigits: asset.sym === 'fBTC' ? 4 : 1 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RiskDial({
  profile,
  setProfile,
  profiles,
  assets,
}: {
  profile: string;
  setProfile: (p: string) => void;
  profiles: RiskProfiles;
  assets: Asset[];
}) {
  const order = ['Conservative', 'Balanced', 'Aggressive'];
  const activeIdx = order.indexOf(profile);
  const current = profiles[profile as keyof typeof profiles];

  return (
    <div style={{
      position: 'relative',
      border: '1px solid var(--rule)',
      borderRadius: 'var(--r-lg)',
      background: 'var(--ink-2)',
      padding: 22,
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">Risk Guardrail</div>
          <div className="display italic" style={{ fontSize: 22, lineHeight: 1.2, marginTop: 4 }}>
            On-chain lock
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 8px', borderRadius: 999,
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
        }}>
          <Icon name="lock" size={11} />
          <span className="eyebrow" style={{ color: 'var(--accent)', fontSize: 9 }}>ENFORCED</span>
        </div>
      </div>

      {/* Vertical dial */}
      <div style={{ display: 'grid', gridTemplateColumns: '62px 1fr', gap: 18 }}>
        <div style={{ position: 'relative', width: 62 }}>
          {/* Track */}
          <div style={{
            position: 'absolute', left: 26, top: 6, bottom: 6, width: 8,
            background: 'var(--ink-3)',
            border: '1px solid var(--rule)',
            borderRadius: 4,
          }} />
          {/* Active fill */}
          <div style={{
            position: 'absolute', left: 27, top: 7, width: 6,
            height: `${(activeIdx + 1) * 33}%`,
            background: 'linear-gradient(180deg, var(--accent), var(--accent-deep))',
            borderRadius: 3,
            transition: 'height 360ms cubic-bezier(.2,.7,.2,1)',
            boxShadow: '0 0 12px var(--accent-soft)',
          }} />
          {/* Stops */}
          {order.map((p, i) => {
            const top = i * 50;
            const active = profile === p;
            return (
              <button key={p} onClick={() => setProfile(p)}
                style={{
                  position: 'absolute',
                  top: `${top}%`,
                  left: 0,
                  width: 62, height: 22,
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', border: 0, cursor: 'pointer',
                  fontFamily: 'inherit', color: 'inherit',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--rule)'}`,
                  background: active ? 'var(--accent)' : 'var(--ink-3)',
                  transition: 'all 220ms',
                  display: 'grid', placeItems: 'center',
                }}>
                  {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-fg)' }} />}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'space-between' }}>
          {order.map(p => (
            <button key={p} onClick={() => setProfile(p)}
              style={{
                background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                textAlign: 'left', color: 'inherit', fontFamily: 'inherit',
                opacity: profile === p ? 1 : 0.42,
                transition: 'opacity 200ms',
              }}>
              <div className="display italic" style={{ fontSize: 18, lineHeight: 1 }}>{p}</div>
              <div className="eyebrow" style={{ marginTop: 4 }}>
                DD {profiles[p as keyof typeof profiles].drawdown.replace('≤ ', '≤')} · min {profiles[p as keyof typeof profiles].minApy}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rule" />

      <p style={{ fontSize: 12.5, color: 'var(--paper-2)', lineHeight: 1.6, margin: 0, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
        {current.blurb}
      </p>

      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Allocation caps</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {assets.map(a => {
            const cap = current.max[a.id] || 0;
            const cur = a.weight;
            const ratio = cur / cap;
            const warn = ratio > 0.85;
            return (
              <div key={a.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span className="mono" style={{ color: 'var(--paper-2)' }}>{a.sym}</span>
                  <span className="mono" style={{ fontSize: 11 }}>
                    <span style={{ color: warn ? 'var(--warning)' : 'var(--paper)' }}>{Math.round(cur * 100)}</span>
                    <span className="dim" style={{ margin: '0 4px' }}>/</span>
                    {Math.round(cap * 100)}%
                  </span>
                </div>
                <div style={{ height: 3, marginTop: 6, background: 'var(--ink-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, ratio * 100)}%`, height: '100%',
                    background: warn ? 'var(--warning)' : a.color,
                    transition: 'width 460ms',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DecisionTape({ entries }: { entries: FeedEntry[] }) {
  const items = useMemo(() => [...entries, ...entries].map((e, i) => ({ ...e, _idx: i })), [entries]);
  return (
    <div className="tape">
      <div className="tape-track">
        {items.map((e, i) => (
          <TapeItem key={i} entry={e} />
        ))}
      </div>
    </div>
  );
}

function TapeItem({ entry }: { entry: FeedEntry }) {
  const color = entry.kind === 'guard' ? 'var(--negative)'
    : entry.kind === 'bridge' ? 'var(--info)'
    : entry.kind === 'scan' ? 'var(--paper-3)'
    : 'var(--accent)';
  const label = entry.kind === 'guard' ? 'BLOCKED'
    : entry.kind === 'bridge' ? 'BRIDGE'
    : entry.kind === 'scan' ? 'SCAN'
    : 'REBAL';
  return (
    <span className="tape-item">
      <span className="dim">{entry.timestamp}</span>
      <span style={{
        padding: '2px 6px', borderRadius: 3,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color, fontSize: 10, letterSpacing: '0.08em',
      }}>{label}</span>
      <span style={{ color: 'var(--paper)' }}>{entry.title}</span>
      {entry.tx && <span className="dim">· tx {entry.tx}</span>}
      <span className="dim">·</span>
    </span>
  );
}

function memoColor(kind: string): string {
  return kind === 'guard' ? 'var(--negative)'
    : kind === 'bridge' ? 'var(--info)'
    : kind === 'scan' ? 'var(--paper-3)'
    : 'var(--accent)';
}
function memoLabel(kind: string): string {
  return kind === 'guard' ? 'GUARDRAIL'
    : kind === 'bridge' ? 'BRIDGE'
    : kind === 'scan' ? 'SCAN'
    : 'REBALANCE';
}

export function AgentMemoStream({
  entries,
  personality = 'analyst',
  limit = 5,
}: {
  entries: FeedEntry[];
  personality?: string;
  limit?: number;
}) {
  const shown = entries.slice(0, limit);
  if (personality === 'terminal') {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--paper-2)', lineHeight: 1.7 }}>
        {shown.map(e => (
          <div key={e._key} className="slidein" style={{ marginBottom: 12, paddingLeft: 8, borderLeft: `2px solid ${memoColor(e.kind)}` }}>
            <div>
              <span className="dim">[{e.timestamp}]</span>{' '}
              <span style={{ color: memoColor(e.kind), textTransform: 'uppercase' }}>{memoLabel(e.kind)}</span>{' '}
              <span style={{ color: 'var(--paper)' }}>{e.title}</span>
            </div>
            <div className="dim" style={{ paddingLeft: 18 }}>→ {e.body}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {shown.map(e => (
        <article key={e._key} className="slidein" style={{ paddingBottom: 18, borderBottom: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 999,
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
              color: memoColor(e.kind),
              border: `1px solid color-mix(in srgb, ${memoColor(e.kind)} 35%, transparent)`,
            }}>{memoLabel(e.kind)}</span>
            <span className="eyebrow">{e.timestamp}</span>
            <span className="eyebrow dim" style={{ marginLeft: 'auto' }}>{e.venue}</span>
          </div>
          <h4 style={{
            margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400,
            fontSize: 20, lineHeight: 1.25, color: 'var(--paper)',
          }}>{e.title}</h4>
          <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--paper-2)', lineHeight: 1.65, maxWidth: 620 }}>{e.body}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: 11.5 }}>
            {e.delta !== 'no action' && (
              <span className="mono" style={{
                padding: '2px 6px', borderRadius: 3,
                background: `color-mix(in srgb, ${memoColor(e.kind)} 12%, transparent)`,
                color: memoColor(e.kind),
              }}>{e.delta}</span>
            )}
            {e.tx && (
              <a href="#" className="mono dim" style={{ textDecoration: 'none' }}>
                tx {e.tx} <Icon name="external" size={10} />
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
