'use client';

import { Icon } from './icons';
import type { Agent } from '@/lib/data';

export function V2TopBar({
  walletSlot,
  page,
  setPage,
}: {
  walletSlot: React.ReactNode;
  page: string;
  setPage: (p: string) => void;
}) {
  const navItems = [
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'agents', label: 'Agents' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'history', label: 'History' },
  ];

  return (
    <header className="top">
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <Mark />
        <span className="eyebrow" style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 18 }}>
          Mantle Sepolia · ERC-8004
        </span>
      </div>

      <nav style={{ display: 'flex', gap: 4 }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className="btn btn-sm"
            onClick={() => setPage(item.id)}
            style={{
              padding: '8px 14px',
              color: page === item.id ? 'var(--paper)' : 'var(--paper-3)',
              fontWeight: 500,
              borderBottom: page === item.id ? '1px solid var(--accent)' : '1px solid transparent',
              borderRadius: 0,
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="live-dot" />
        <span className="eyebrow" style={{ color: 'var(--paper-2)' }}>Live</span>
        <span style={{ width: 1, height: 18, background: 'var(--rule)', margin: '0 6px' }} />
        {walletSlot}
      </div>
    </header>
  );
}

export function Mark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ display: 'block' }}>
        <circle cx="14" cy="14" r="12.5" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
        <path d="M 3 16 Q 14 6 25 16" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
        <path d="M 3 12 Q 14 22 25 12" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
        <circle cx="14" cy="14" r="2" fill="var(--accent)" />
      </svg>
      <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, letterSpacing: '-0.01em' }}>
        Equinox<span style={{ color: 'var(--accent)' }}>·</span>RWA
      </span>
    </div>
  );
}

export function MemoHero({
  memo,
  navValue,
  change24,
  ytd,
  agent,
  profile,
}: {
  memo: { no: string; date: string; kind: string; delta: string; from: string; to: string; body: string; tx: string };
  navValue: number;
  change24: number;
  ytd: number;
  agent: Agent;
  profile: string;
}) {
  return (
    <section className="hero">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="eyebrow">Memo № {memo.no.padStart(3, '0')}</span>
          <span style={{ width: 32, height: 1, background: 'var(--rule)' }} />
          <span className="eyebrow" style={{ color: 'var(--paper-2)' }}>{memo.date}</span>
          <span style={{ width: 32, height: 1, background: 'var(--rule)' }} />
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>{memo.kind}</span>
        </div>

        <h1>
          Rebalanced <em>{memo.delta}</em> {memo.from}{' '}
          <span style={{ color: 'var(--paper-3)' }}>→</span> {memo.to} ahead of{' '}
          <em>Mantle staking incentive cycle.</em>
        </h1>

        <p
          style={{
            fontSize: 16,
            color: 'var(--paper-2)',
            lineHeight: 1.65,
            maxWidth: 580,
            marginTop: 24,
            textWrap: 'pretty' as React.CSSProperties['textWrap'],
          }}
        >
          {memo.body}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 24, color: 'var(--paper-3)', fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="agent" size={14} color="var(--paper-2)" />
            <span>By <span style={{ color: 'var(--paper)' }}>{agent.name}</span></span>
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--paper-4)' }} />
          <span className="mono" style={{ color: 'var(--paper-3)' }}>
            ref {memo.tx}
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--paper-4)' }} />
          <span className="mono dim">Mantle Sepolia</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 24 }}>
        <AgentMark agent={agent} profile={profile} />
        <div
          style={{
            padding: '20px 22px',
            border: '1px solid var(--rule)',
            borderRadius: 'var(--r-lg)',
            background: 'var(--ink-2)',
          }}
        >
          <div className="eyebrow">Net Asset Value</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
            <span className="display italic" style={{ fontSize: 44, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--paper)', whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontStyle: 'normal', fontSize: 22, color: 'var(--paper-3)', marginRight: 4 }}>$</span>
              {navValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12, color: 'var(--paper-3)' }}>
            <span><span className="eyebrow">24h</span> <span className="num pos" style={{ marginLeft: 6, fontSize: 13 }}>{change24 >= 0 ? '+' : ''}{change24.toFixed(2)}%</span></span>
            <span><span className="eyebrow">YTD</span> <span className="num pos" style={{ marginLeft: 6, fontSize: 13 }}>{ytd >= 0 ? '+' : ''}{ytd.toFixed(2)}%</span></span>
            <span><span className="eyebrow">Sharpe</span> <span className="num" style={{ marginLeft: 6, fontSize: 13, color: 'var(--paper)' }}>{agent.sharpe.toFixed(2)}</span></span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AgentMark({ agent, profile }: { agent: Agent; profile: string }) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '22px 22px 20px',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--r-lg)',
        background: 'linear-gradient(155deg, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%), var(--ink-2)',
        overflow: 'hidden',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="dotgrid" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="var(--paper)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
        <SigilMark agent={agent} size={84} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">ERC-8004 Identity</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, lineHeight: 1.1, marginTop: 4 }}>
            {agent.name}
          </div>
          <div className="mono" style={{ color: 'var(--paper-3)', fontSize: 12, marginTop: 4 }}>
            #{agent.id} · {profile}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
            <ReputationBar score={agent.score} />
            <span className="num" style={{ fontSize: 16, fontWeight: 500, color: 'var(--accent)' }}>{agent.score}</span>
            <span className="dim" style={{ fontSize: 11 }}>/ 100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReputationBar({ score }: { score: number }) {
  return (
    <div style={{ flex: 1, position: 'relative', height: 14, display: 'flex', alignItems: 'center' }}>
      <svg width="100%" height="14" preserveAspectRatio="none" viewBox="0 0 100 14">
        {Array.from({ length: 21 }, (_, index) => {
          const x = (index / 20) * 100;
          const tall = index % 5 === 0;
          const filled = (index / 20) * 100 <= score;

          return (
            <line
              key={index}
              x1={x}
              x2={x}
              y1={tall ? 0 : 4}
              y2={tall ? 14 : 10}
              stroke={filled ? 'var(--accent)' : 'var(--rule)'}
              strokeWidth={tall ? 1 : 0.7}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function SigilMark({ agent, size = 84 }: { agent: Agent; size?: number }) {
  const score = agent.score;
  const arc = (score / 100) * 360;
  const seed = agent.id;
  const angle = (seed * 137) % 360;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        flexShrink: 0,
        borderRadius: '50%',
        background: `conic-gradient(from -90deg, var(--accent) ${arc}deg, color-mix(in srgb, var(--accent) 18%, transparent) ${arc}deg)`,
        padding: 2,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'var(--ink-2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id={`sg-${agent.id}`} cx="50%" cy="30%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="40" cy="40" r="36" fill={`url(#sg-${agent.id})`} />
          <g transform={`rotate(${angle} 40 40)`}>
            <path d="M 12 40 Q 40 18 68 40 Q 40 62 12 40 Z" fill="none" stroke="var(--accent)" strokeWidth="0.8" opacity="0.8" />
            <path d="M 16 40 Q 40 26 64 40 Q 40 54 16 40 Z" fill="none" stroke="var(--accent)" strokeWidth="0.6" opacity="0.5" />
          </g>
          <circle cx="40" cy="40" r="28" fill="none" stroke="var(--accent)" strokeWidth="0.4" opacity="0.35" />
          <circle cx="40" cy="40" r="20" fill="none" stroke="var(--accent)" strokeWidth="0.4" opacity="0.55" />
          <circle cx="40" cy="40" r="3.4" fill="var(--accent)" />
        </svg>
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 9,
            color: 'var(--paper-3)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
          }}
        >
          #{agent.id}
        </div>
      </div>
    </div>
  );
}
