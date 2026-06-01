'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ── Static data ────────────────────────────────────────────────────────

const PROBLEMS = [
  {
    n: '01',
    title: 'Single-Asset Lock-In',
    body: 'Competitors like Giza ARMA optimize only stablecoins, missing yield momentum from volatile native assets like mETH and fBTC.',
  },
  {
    n: '02',
    title: 'The Black Box Problem',
    body: 'Users forced to trust opaque off-chain AI decisions with no verifiable track record or audit trail. Pure blind faith.',
  },
  {
    n: '03',
    title: 'On-Chain Rigidity',
    body: 'Traditional aggregators are stuck on-chain, missing CeFi rate spikes. No bridge to institutional-grade exchanges like Bybit.',
  },
  {
    n: '04',
    title: 'Unconstrained APY Chasing',
    body: 'Automated bots chase highest yields without risk constraints, exposing capital to illiquid pools and vulnerable strategies.',
  },
];

const FEATURES = [
  {
    num: '01',
    title: 'Cross-Asset Optimization',
    body: 'Simultaneously optimizes across mETH, USDY, fBTC, and MI4 — Mantle\'s four power assets. No single-asset blinders.',
    accent: '#B4A0FF',
    icon: '⊞',
    image: '/feature-cross-asset.png',
  },
  {
    num: '02',
    title: 'ERC-8004 Agent Reputation',
    body: 'Every AI agent minted as an on-chain NFT. Win rates, drawdowns, and APY history recorded immutably. Trust is earned on-chain.',
    accent: '#9DEFC0',
    icon: '◈',
    image: '/feature-agent-reputation.png',
  },
  {
    num: '03',
    title: 'Cross-World Bridge',
    body: 'Automatically moves assets between Mantle DeFi protocols and Bybit CeFi Earn when rate differentials justify the bridge.',
    accent: '#F5C76B',
    icon: '⇌',
    image: '/feature-cross-world-bridge.png',
  },
  {
    num: '04',
    title: 'Risk-Adjusted Guardrails',
    body: 'Smart contracts enforce your chosen risk profile. Any deviation — even from the AI — is rejected at the blockchain level.',
    accent: '#F09A82',
    icon: '⊗',
    image: '/feature-risk-guardrails.png',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Connect & Configure',
    body: 'Connect your wallet on Mantle, deposit assets, and choose your risk profile. Your parameters are locked on-chain from the start.',
  },
  {
    n: '02',
    title: 'Agent Identity Minted',
    body: 'An ERC-8004 NFT is created as your personal AI agent identity. Your vault binds to its reputation record from day one.',
  },
  {
    n: '03',
    title: 'Autonomous Rebalancing',
    body: 'The AI engine continuously scans DeFi and CeFi for yield opportunities, executing optimal rebalances within your locked parameters.',
  },
  {
    n: '04',
    title: 'Transparent Decision Log',
    body: 'Every decision is logged on Mantle with a reasoning hash. The guardrail rejects anything that violates your risk profile — on-chain.',
  },
];

const RISK_PROFILES = [
  {
    name: 'Conservative',
    range: '4–6%',
    desc: 'Capital preservation first. Stablecoin-heavy allocation with minimal exposure to volatile assets.',
    color: '#7EBDF2',
    tags: ['USDY dominant', 'mETH ≤ 20%', 'No fBTC'],
  },
  {
    name: 'Balanced',
    range: '6–9%',
    desc: 'Optimal risk-reward. Mixed allocation across stablecoins and growth assets with CeFi bridging enabled.',
    color: '#9DEFC0',
    tags: ['mETH 30–50%', 'USDY 30–40%', 'fBTC ≤ 20%'],
    featured: true,
  },
  {
    name: 'Aggressive',
    range: '9–15%',
    desc: 'Maximum yield pursuit. Full range allocation across all asset classes including high-APY volatile strategies.',
    color: '#F09A82',
    tags: ['fBTC unlocked', 'Full CeFi access', 'MI4 indexing'],
  },
];

const TOPO_PROTOCOLS = [
  { cat: 'DeFi', token: 'ETH',  name: 'Aave V3',     apy: '4.31', color: '#B4A0FF', active: true },
  { cat: 'RWA',  token: 'USDY', name: 'Ondo USDY',   apy: '4.20', color: '#F5C76B', active: true },
  { cat: 'DeFi', token: 'fBTC', name: 'CIAN Vaults', apy: '8.00', color: '#F09A82', active: false },
  { cat: 'CeFi', token: 'USDY', name: 'Bybit Fixed', apy: '4.80', color: '#7EBDF2', active: false },
];

// ── Helpers ────────────────────────────────────────────────────────────

const shell: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '0 36px' };

// ── Navigation ─────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 64, transition: 'border-color 300ms, background 300ms',
      borderBottom: scrolled ? '1px solid var(--rule)' : '1px solid transparent',
      background: scrolled ? 'color-mix(in srgb, var(--ink) 85%, transparent)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
    }}>
      <div style={{ ...shell, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span className="display italic" style={{ fontSize: 20, letterSpacing: '-0.02em', color: 'var(--paper)' }}>
            Equinox RWA
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            {['Product', 'Architecture', 'Docs'].map((item) => (
              <a key={item} href="#"
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, color: 'var(--paper-3)', textDecoration: 'none', transition: 'color 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--paper)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--paper-3)'; }}
              >{item}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--positive)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--positive)', display: 'inline-block', animation: 'pulse-soft 2s ease infinite' }} />
            Live on Mantle
          </span>
          <Link href="/app" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0 18px', height: 36, borderRadius: 8,
            background: 'var(--accent)', color: 'var(--accent-fg)',
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
            transition: 'filter 150ms',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.07)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
          >
            Launch App →
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="landing-hero" style={{
      minHeight: 'calc(100vh - 48px)',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 64,
      paddingBottom: 72,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          pointerEvents: 'none',
        }}
      >
        <source src="/landingpage.mp4" type="video/mp4" />
      </video>
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: [
          'linear-gradient(90deg, var(--ink) 0%, color-mix(in srgb, var(--ink) 92%, transparent) 30%, color-mix(in srgb, var(--ink) 38%, transparent) 68%, var(--ink) 100%)',
          'linear-gradient(180deg, color-mix(in srgb, var(--ink) 68%, transparent) 0%, transparent 24%, color-mix(in srgb, var(--ink) 72%, transparent) 100%)',
        ].join(', '),
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        boxShadow: 'inset 0 -90px 110px var(--ink), inset 0 90px 100px color-mix(in srgb, var(--ink) 72%, transparent)',
      }} />

      <div style={{ ...shell, position: 'relative', width: '100%', transform: 'translateY(-36px)' }}>

        <h1 className="hero-title landing-hero-title display italic" style={{
          fontSize: 'var(--landing-hero-title-size, 104px)',
          lineHeight: 0.98,
          letterSpacing: '-0.02em',
          margin: '0 0 26px',
          color: 'var(--paper)',
          maxWidth: 680,
          textShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}>
          Equinox<span style={{ color: 'var(--accent)' }}>.</span>RWA
        </h1>

        <p className="hero-sub" style={{
          fontSize: 18, lineHeight: 1.75, color: 'var(--paper-2)',
          maxWidth: 560, margin: 0,
          textShadow: '0 12px 36px rgba(0,0,0,0.65)',
        }}>
          Institutional-grade DeFAI portfolio engine for Mantle. Autonomous yield management across RWA, DeFi, and CeFi with on-chain agent reputation and enforceable risk guardrails.
        </p>

      </div>

      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--paper-4)' }}>Scroll</span>
        <div style={{ width: 1, height: 44, background: 'linear-gradient(to bottom, var(--paper-4), transparent)' }} />
      </div>
    </section>
  );
}

function LaunchAppPreview() {
  return (
    <div className="landing-app-preview-wrap">
      <div className="landing-app-preview">
        <Image
          src="/image.png"
          alt="Equinox launch app dashboard"
          width={1844}
          height={967}
          priority
        />
      </div>
    </div>
  );
}

function Section3VideoBackground() {
  return (
    <div className="landing-section3-video-bg" aria-hidden="true">
      <video
        muted
        loop
        playsInline
        preload="auto"
        className="landing-section3-scroll-video"
      >
        <source src="/section3.mp4" type="video/mp4" />
      </video>
      <div className="landing-section3-video-overlay" />
    </div>
  );
}

// ── Capital Topology Mock ──────────────────────────────────────────────

function CapitalTopologySection() {
  const [activeProtocol, setActiveProtocol] = useState<number | null>(null);

  // SVG coordinate system: 1000 x 360
  // Vault: center at (90, 180)
  // Agent: center at (420, 180)
  // Protocols: right column at x~700, y = 60,130,200,270

  const protoY = [60, 130, 200, 270];
  const vaultX = 90, vaultY = 180;
  const agentX = 420, agentY = 180;
  const protoLeftX = 610, protoWidth = 190;

  function curvePath(fromX: number, fromY: number, toX: number, toY: number) {
    const mx = (fromX + toX) / 2;
    return `M ${fromX} ${fromY} C ${mx} ${fromY}, ${mx} ${toY}, ${toX} ${toY}`;
  }

  return (
    <section id="architecture" className="landing-overlap-section" style={{ padding: 'var(--landing-architecture-pad-top, 400px) 0 100px', borderTop: '1px solid var(--rule)', minHeight: '100vh' }}>
      <div style={shell}>

        {/* Section header */}
        <div className="reveal" style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>
            Capital Topology
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <h2 className="display italic" style={{ fontSize: 'clamp(36px, 5vw, 62px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: 0 }}>
              Your AI agent.<br />Live on Mantle.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--paper-2)', lineHeight: 1.7, maxWidth: 380, margin: 0 }}>
              Watch in real-time as your agent navigates yield opportunities across
              DeFi protocols and CeFi exchanges, recording every decision on-chain.
            </p>
          </div>
        </div>

        {/* Topology card */}
        <div className="reveal" style={{
          borderRadius: 16, border: '1px solid var(--rule)', overflow: 'hidden',
          background: 'var(--ink-2)',
        }}>
          {/* Header bar */}
          <div style={{
            borderBottom: '1px solid var(--rule)', padding: '11px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--ink-3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--paper-2)', textTransform: 'uppercase' }}>
                ◉ Capital Topology
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 9px', border: '1px solid color-mix(in srgb, var(--positive) 40%, transparent)',
                borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--positive)',
              }}>
                <span style={{ width: 5, height: 5, background: 'var(--positive)', borderRadius: '50%', animation: 'pulse-soft 2s ease infinite' }} />
                LIVE
              </span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--paper-4)', textTransform: 'uppercase' }}>
                Aggressive Bounds
              </span>
            </div>
            <button style={{
              background: 'transparent', border: '1px solid var(--rule)', borderRadius: 6,
              padding: '5px 12px', fontSize: 11, fontFamily: 'var(--font-mono)',
              color: 'var(--paper-3)', cursor: 'pointer', transition: 'color 150ms, border-color 150ms',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--paper)'; e.currentTarget.style.borderColor = 'var(--paper-4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--paper-3)'; e.currentTarget.style.borderColor = 'var(--rule)'; }}
            >
              ✦ Simulate CeFi pivot
            </button>
          </div>

          {/* Main visualization */}
          <div style={{ position: 'relative', height: 360, overflow: 'hidden' }}>

            {/* Grid background */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(var(--rule-soft) 1px, transparent 1px), linear-gradient(90deg, var(--rule-soft) 1px, transparent 1px)',
              backgroundSize: '32px 32px', backgroundPosition: '-1px -1px',
              maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
            }} />

            {/* Agent glow */}
            <div style={{
              position: 'absolute',
              left: `${(agentX / 1000) * 100}%`, top: `${(agentY / 360) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 220, height: 220,
              background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* SVG connections */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 1000 360" preserveAspectRatio="none">
              <defs>
                <linearGradient id="vaultLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {/* Vault → Agent */}
              <path
                d={`M ${vaultX + 55} ${vaultY} L ${agentX - 22} ${agentY}`}
                stroke="url(#vaultLineGrad)" strokeWidth="1.5" strokeDasharray="7 5" fill="none"
                style={{ animation: 'dash-flow 1.8s linear infinite' }}
              />

              {/* Agent → Protocols */}
              {protoY.map((py, i) => (
                <path
                  key={i}
                  d={curvePath(agentX + 22, agentY, protoLeftX, py)}
                  stroke={activeProtocol === i ? TOPO_PROTOCOLS[i].color : 'var(--accent)'}
                  strokeWidth={activeProtocol === i ? 1.5 : 1}
                  strokeDasharray="5 5"
                  strokeOpacity={activeProtocol === i ? 0.9 : 0.4}
                  fill="none"
                  style={{ animation: `dash-flow ${1.4 + i * 0.25}s linear infinite`, transition: 'stroke-opacity 200ms, stroke 200ms' }}
                />
              ))}

              {/* Small dots at protocol entry points */}
              {protoY.map((py, i) => (
                <circle
                  key={`dot-${i}`}
                  cx={protoLeftX}
                  cy={py}
                  r="3"
                  fill={TOPO_PROTOCOLS[i].active ? TOPO_PROTOCOLS[i].color : 'var(--paper-4)'}
                  opacity={TOPO_PROTOCOLS[i].active ? 0.9 : 0.3}
                />
              ))}
            </svg>

            {/* VAULT box */}
            <div style={{
              position: 'absolute',
              left: `${((vaultX - 55) / 1000) * 100}%`,
              top: `${((vaultY - 44) / 360) * 100}%`,
              width: 100, height: 88,
              border: '1px solid var(--rule)', borderRadius: 8,
              background: 'var(--ink-3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--paper-4)' }}>Vault</div>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--paper)' }}>$12.5k</div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--paper-4)' }}>Your capital</div>
            </div>

            {/* AGENT node */}
            <div style={{
              position: 'absolute',
              left: `${(agentX / 1000) * 100}%`,
              top: `${(agentY / 360) * 100}%`,
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--paper-3)', marginBottom: 8 }}>AGENT</div>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', margin: '0 auto',
                border: '1.5px solid var(--accent)',
                background: 'color-mix(in srgb, var(--accent) 12%, var(--ink))',
                display: 'grid', placeItems: 'center', position: 'relative',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                <div style={{
                  position: 'absolute', inset: -7, borderRadius: '50%',
                  border: '1px solid var(--accent)', opacity: 0.25,
                  animation: 'pulse-soft 2s ease infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: -14, borderRadius: '50%',
                  border: '1px solid var(--accent)', opacity: 0.1,
                  animation: 'pulse-soft 2s ease infinite 0.4s',
                }} />
              </div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--paper-4)', marginTop: 8 }}>ERC-8004</div>
            </div>

            {/* Protocol cards */}
            <div style={{
              position: 'absolute',
              left: `${(protoLeftX / 1000) * 100}%`,
              top: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-around',
              padding: '18px 0',
              width: `${(protoWidth / 1000) * 100}%`,
            }}>
              {TOPO_PROTOCOLS.map((p, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setActiveProtocol(i)}
                  onMouseLeave={() => setActiveProtocol(null)}
                  style={{
                    border: `1px solid ${p.active ? p.color + '55' : 'var(--rule)'}`,
                    borderRadius: 7, padding: '8px 12px',
                    background: p.active
                      ? `color-mix(in srgb, ${p.color} 6%, var(--ink))`
                      : 'var(--ink-3)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'default', transition: 'border-color 200ms, background 200ms',
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: p.active ? p.color : 'var(--paper-4)', marginBottom: 3,
                    }}>
                      {p.cat} / {p.token}
                    </div>
                    <div style={{ fontSize: 12, color: p.active ? 'var(--paper)' : 'var(--paper-2)' }}>{p.name}</div>
                  </div>
                  <div style={{
                    fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 600,
                    color: p.active ? p.color : 'var(--paper-3)',
                  }}>
                    {p.apy}%
                  </div>
                </div>
              ))}
            </div>

            {/* Right-side CeFi cluster */}
            <div style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {[
                { cat: 'CeFi', token: 'USDY', name: 'Bybit Fixed', apy: '1.0', color: '#7EBDF2' },
                { cat: 'CeFi', token: 'BETA', name: 'Bybit Fixed', apy: '0.2', color: '#7EBDF2' },
              ].map((p, i) => (
                <div key={i} style={{
                  border: '1px solid var(--rule)', borderRadius: 7, padding: '7px 11px',
                  background: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--paper-4)', marginBottom: 2 }}>
                      {p.cat} / {p.token}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--paper-3)' }}>{p.name}</div>
                  </div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--paper-4)' }}>{p.apy}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Problem Section ────────────────────────────────────────────────────

function ProblemSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="landing-problem-section" style={{ padding: '120px 0', borderTop: '1px solid var(--rule)' }}>
      <div style={shell}>

        {/* Asymmetric two-column header */}
        <div className="reveal" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0 64px',
          alignItems: 'flex-end',
          marginBottom: 80,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--paper-4)', marginBottom: 20,
            }}>
              The Yield Problem
            </div>
            <h2 className="display italic" style={{
              fontSize: 'clamp(40px, 5.5vw, 68px)', lineHeight: 1.0,
              letterSpacing: '-0.025em', margin: 0,
            }}>
              Four failures of<br />
              <em style={{ color: 'var(--negative)' }}>DeFi yield today.</em>
            </h2>
          </div>
          <p style={{
            fontSize: 15, color: 'var(--paper-3)', lineHeight: 1.85,
            margin: 0, paddingBottom: 6,
          }}>
            Today&apos;s yield infrastructure is broken. Siloed assets, opaque AI, rigid on-chain
            logic, and unconstrained risk chasing — four failures Equinox was built to solve.
          </p>
        </div>

        {/* Full-width editorial rows */}
        <div className="reveal-stagger">
          {PROBLEMS.map((p, i) => (
            <div
              key={i}
              className="stagger-item"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative',
                borderTop: '1px solid var(--rule)',
                padding: '52px 0 52px 24px',
                display: 'grid',
                gridTemplateColumns: '60px 1fr 320px 28px',
                gap: '0 32px',
                alignItems: 'center',
                cursor: 'default',
                overflow: 'hidden',
                background: hovered === i
                  ? 'color-mix(in srgb, var(--negative) 4%, transparent)'
                  : 'transparent',
                transition: 'background 350ms',
              }}
            >
              {/* Sweeping left accent bar */}
              <div style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0, width: 2,
                background: 'var(--negative)',
                transformOrigin: 'top',
                transform: hovered === i ? 'scaleY(1)' : 'scaleY(0)',
                transition: 'transform 380ms cubic-bezier(.4, 0, .2, 1)',
              }} />

              {/* Giant watermark number */}
              <div style={{
                position: 'absolute',
                right: -4,
                top: '50%',
                transform: hovered === i
                  ? 'translateY(-50%) scale(1.06)'
                  : 'translateY(-50%) scale(1)',
                fontSize: 148,
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                letterSpacing: '-0.06em',
                lineHeight: 1,
                userSelect: 'none',
                pointerEvents: 'none',
                color: hovered === i
                  ? 'color-mix(in srgb, var(--negative) 9%, transparent)'
                  : 'color-mix(in srgb, var(--paper) 4%, transparent)',
                transition: 'color 350ms, transform 380ms cubic-bezier(.2, .7, .2, 1)',
              }}>
                {p.n}
              </div>

              {/* Small mono index */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                color: hovered === i ? 'var(--negative)' : 'var(--paper-4)',
                transition: 'color 220ms',
                position: 'relative',
              }}>
                {p.n}
              </div>

              {/* Large italic title */}
              <h3 className="display italic" style={{
                fontSize: 'clamp(22px, 2.8vw, 38px)',
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: hovered === i ? 'var(--paper)' : 'var(--paper-2)',
                transition: 'color 220ms',
                position: 'relative',
              }}>
                {p.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: 14,
                color: hovered === i ? 'var(--paper-3)' : 'var(--paper-4)',
                lineHeight: 1.8,
                margin: 0,
                transition: 'color 220ms',
                position: 'relative',
              }}>
                {p.body}
              </p>

              {/* Arrow indicator */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                color: 'var(--negative)',
                opacity: hovered === i ? 1 : 0,
                transform: hovered === i ? 'translateX(0)' : 'translateX(-10px)',
                transition: 'opacity 220ms, transform 260ms cubic-bezier(.2,.7,.2,1)',
                position: 'relative',
              }}>
                →
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--rule)' }} />
        </div>
      </div>
    </section>
  );
}

// ── Feature Section ────────────────────────────────────────────────────

function FeatureSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  const cardBase = (f: typeof FEATURES[0], i: number, extra?: React.CSSProperties): React.CSSProperties => ({
    borderRadius: 0,
    border: `1px solid ${f.accent}${hovered === i ? '50' : '1E'}`,
    background: '#000',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'default',
    transition: 'border-color 280ms, transform 300ms cubic-bezier(.2,.7,.2,1)',
    transform: hovered === i ? 'translateY(-4px)' : 'none',
    ...extra,
  });

  const featureAsset = (
    f: typeof FEATURES[0],
    i: number,
    style: React.CSSProperties,
  ) => (
    <div style={{
      position: 'absolute',
      pointerEvents: 'none',
      transition: 'opacity 300ms, transform 360ms cubic-bezier(.2,.7,.2,1)',
      opacity: hovered === i ? 0.78 : 0.54,
      transform: hovered === i ? 'scale(1.035)' : 'scale(1)',
      filter: 'saturate(1.1) contrast(1.08)',
      ...style,
    }}>
      <Image
        src={f.image}
        alt=""
        fill
        sizes="(max-width: 900px) 80vw, 520px"
        style={{ objectFit: 'contain', mixBlendMode: 'screen' }}
      />
    </div>
  );

  return (
    <section style={{ padding: '120px 0', borderTop: '1px solid var(--rule)' }}>
      <div style={shell}>

        {/* Header */}
        <div className="reveal" style={{ marginBottom: 72, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>
              The Equinox Advantage
            </div>
            <h2 className="display italic" style={{ fontSize: 'clamp(36px, 5vw, 62px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: 0 }}>
              Four pillars that<br />
              change everything.
            </h2>
          </div>
          <p style={{ fontSize: 15, color: 'var(--paper-2)', lineHeight: 1.7, maxWidth: 340, margin: 0 }}>
            Equinox is the only DeFAI platform that bridges on-chain and off-chain yield
            with verifiable AI decision-making.
          </p>
        </div>

        {/* Asymmetric bento grid — 5-col base, row1: 3+2, row2: 2+3 */}
        <div className="reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>

          {/* ── Feature 01: Wide (3/5) — top left ── */}
          <div
            className="stagger-item"
            style={cardBase(FEATURES[0], 0, { gridColumn: 'span 3', padding: '48px 44px', minHeight: 320 })}
            onMouseEnter={() => setHovered(0)}
            onMouseLeave={() => setHovered(null)}
          >
            {featureAsset(FEATURES[0], 0, { right: -34, top: 18, width: '48%', height: '86%' })}
            {/* Corner glow */}
            <div style={{
              position: 'absolute', top: -50, left: -50, width: 220, height: 220, borderRadius: '50%',
              background: `radial-gradient(circle, ${FEATURES[0].accent}${hovered === 0 ? '1A' : '0A'}, transparent 70%)`,
              transition: 'background 300ms', pointerEvents: 'none',
            }} />
            {/* Bottom accent strip */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(to right, ${FEATURES[0].accent}90, transparent)`,
            }} />

            <div style={{ position: 'relative', zIndex: 1, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: FEATURES[0].accent, textTransform: 'uppercase', marginBottom: 'auto', paddingBottom: 40 }}>
              {FEATURES[0].num}
            </div>
            <h3 className="display italic" style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(26px, 2.8vw, 38px)', margin: '0 0 14px', color: 'var(--paper)', letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: '65%' }}>
              {FEATURES[0].title}
            </h3>
            <p style={{ position: 'relative', zIndex: 1, fontSize: 14, color: 'var(--paper-3)', lineHeight: 1.8, margin: 0, maxWidth: '58%' }}>
              {FEATURES[0].body}
            </p>
          </div>

          {/* ── Feature 02: Narrow (2/5) — top right ── */}
          <div
            className="stagger-item"
            style={cardBase(FEATURES[1], 1, { gridColumn: 'span 2', padding: '44px 36px', display: 'flex', flexDirection: 'column' })}
            onMouseEnter={() => setHovered(1)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Right edge accent */}
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: 2,
              background: `linear-gradient(to bottom, transparent, ${FEATURES[1].accent}90, transparent)`,
            }} />
            <div style={{
              position: 'absolute', bottom: -40, right: -40, width: 180, height: 180, borderRadius: '50%',
              background: `radial-gradient(circle, ${FEATURES[1].accent}${hovered === 1 ? '18' : '08'}, transparent 70%)`,
              transition: 'background 300ms', pointerEvents: 'none',
            }} />

            {featureAsset(FEATURES[1], 1, { right: -32, top: 16, width: '58%', height: '58%', opacity: hovered === 1 ? 0.68 : 0.44 })}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: 'auto', paddingBottom: 96 }} />
            <div style={{ position: 'relative', zIndex: 1, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: FEATURES[1].accent, textTransform: 'uppercase', marginBottom: 14 }}>
              {FEATURES[1].num}
            </div>
            <h3 className="display italic" style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(20px, 2.2vw, 28px)', margin: '0 0 12px', color: 'var(--paper)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {FEATURES[1].title}
            </h3>
            <p style={{ position: 'relative', zIndex: 1, fontSize: 14, color: 'var(--paper-3)', lineHeight: 1.75, margin: 0 }}>
              {FEATURES[1].body}
            </p>
          </div>

          {/* ── Feature 03: Narrow (2/5) — bottom left ── */}
          <div
            className="stagger-item"
            style={cardBase(FEATURES[2], 2, { gridColumn: 'span 2', padding: '44px 36px', display: 'flex', flexDirection: 'column' })}
            onMouseEnter={() => setHovered(2)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Left edge accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
              background: `linear-gradient(to bottom, transparent, ${FEATURES[2].accent}90, transparent)`,
            }} />
            <div style={{
              position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%',
              background: `radial-gradient(circle, ${FEATURES[2].accent}${hovered === 2 ? '18' : '08'}, transparent 70%)`,
              transition: 'background 300ms', pointerEvents: 'none',
            }} />

            {featureAsset(FEATURES[2], 2, { left: -46, top: 12, width: '62%', height: '58%', opacity: hovered === 2 ? 0.66 : 0.42 })}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: 'auto', paddingBottom: 100 }} />
            <div style={{ position: 'relative', zIndex: 1, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: FEATURES[2].accent, textTransform: 'uppercase', marginBottom: 14 }}>
              {FEATURES[2].num}
            </div>
            <h3 className="display italic" style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(20px, 2.2vw, 28px)', margin: '0 0 12px', color: 'var(--paper)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {FEATURES[2].title}
            </h3>
            <p style={{ position: 'relative', zIndex: 1, fontSize: 14, color: 'var(--paper-3)', lineHeight: 1.75, margin: 0 }}>
              {FEATURES[2].body}
            </p>
          </div>

          {/* ── Feature 04: Wide (3/5) — bottom right ── */}
          <div
            className="stagger-item"
            style={cardBase(FEATURES[3], 3, { gridColumn: 'span 3', padding: '48px 44px', minHeight: 300 })}
            onMouseEnter={() => setHovered(3)}
            onMouseLeave={() => setHovered(null)}
          >
            {featureAsset(FEATURES[3], 3, { left: -22, top: 10, width: '48%', height: '90%' })}
            {/* Corner glow */}
            <div style={{
              position: 'absolute', bottom: -50, right: -50, width: 220, height: 220, borderRadius: '50%',
              background: `radial-gradient(circle, ${FEATURES[3].accent}${hovered === 3 ? '1A' : '0A'}, transparent 70%)`,
              transition: 'background 300ms', pointerEvents: 'none',
            }} />
            {/* Top accent strip */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(to right, transparent, ${FEATURES[3].accent}90)`,
            }} />

            {/* Content pushed to the right side for the wide card */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', height: '100%' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: FEATURES[3].accent, textTransform: 'uppercase', marginBottom: 'auto', paddingBottom: 40 }}>
                {FEATURES[3].num}
              </div>
              <h3 className="display italic" style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', margin: '0 0 14px', color: 'var(--paper)', letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: '65%' }}>
                {FEATURES[3].title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--paper-3)', lineHeight: 1.8, margin: 0, maxWidth: '60%' }}>
                {FEATURES[3].body}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── How It Works (scroll-pinned) ────────────────────────────────────────

function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !stepsRef.current) return;

    const stepEls = stepsRef.current.querySelectorAll<HTMLElement>('.step-card');
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          scrub: 0.8,
          start: 'top top',
          end: `+=${stepEls.length * 280}`,
          anticipatePin: 1,
        },
      });

      stepEls.forEach((el, i) => {
        if (i === 0) return; // first is already visible
        tl.from(el, { opacity: 0, y: 28, duration: 0.5 }, i * 0.8);
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} style={{ padding: '120px 0', borderTop: '1px solid var(--rule)', overflow: 'hidden' }}>
      <div style={shell}>
        <div className="reveal" style={{ marginBottom: 72 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--paper-4)', marginBottom: 16 }}>
            The Workflow
          </div>
          <h2 className="display italic" style={{ fontSize: 'clamp(36px, 5vw, 62px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: 0 }}>
            From deposit to<br />
            <em style={{ color: 'var(--accent)' }}>autonomous yield.</em>
          </h2>
        </div>

        <div ref={stepsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
          {/* Connecting line */}
          <div style={{
            position: 'absolute', top: 36, left: '12.5%', right: '12.5%', height: 1,
            background: 'linear-gradient(to right, transparent, var(--rule) 15%, var(--rule) 85%, transparent)',
          }} />

          {STEPS.map((s, i) => (
            <div key={i} className="step-card" style={{ padding: '0 24px 0 0', position: 'relative' }}>
              {/* Step number circle */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1px solid var(--rule)',
                background: i === 0 ? 'var(--accent)' : 'var(--ink-2)',
                display: 'grid', placeItems: 'center',
                marginBottom: 28, position: 'relative', zIndex: 1,
              }}>
                <span style={{
                  fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600,
                  color: i === 0 ? 'var(--accent-fg)' : 'var(--paper-3)',
                }}>
                  {s.n}
                </span>
              </div>

              <h3 style={{
                fontSize: 17, margin: '0 0 12px',
                color: 'var(--paper)', letterSpacing: '-0.01em',
                fontFamily: 'var(--font-display)', fontStyle: 'italic',
              }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--paper-3)', lineHeight: 1.75, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Risk Profiles ──────────────────────────────────────────────────────

function RiskSection() {
  const [selected, setSelected] = useState(1); // Balanced default

  return (
    <section style={{ padding: '120px 0', borderTop: '1px solid var(--rule)' }}>
      <div style={shell}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--paper-4)', marginBottom: 16 }}>
            Risk Management
          </div>
          <h2 className="display italic" style={{ fontSize: 'clamp(36px, 5vw, 62px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: '0 0 20px' }}>
            Choose your<br />risk profile.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--paper-2)', maxWidth: 500, margin: '0 auto' }}>
            Every profile is enforced at the smart contract level.
            Your AI agent cannot violate the bounds you set.
          </p>
        </div>

        <div className="reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {RISK_PROFILES.map((r, i) => (
            <div
              key={i}
              className="stagger-item"
              onClick={() => setSelected(i)}
              style={{
                padding: '36px 32px', borderRadius: 14,
                border: `1px solid ${selected === i ? r.color + '70' : 'var(--rule)'}`,
                background: selected === i
                  ? `color-mix(in srgb, ${r.color} 6%, var(--ink-2))`
                  : 'var(--ink-2)',
                cursor: 'pointer',
                transition: 'border-color 200ms, background 200ms, transform 220ms cubic-bezier(.2,.7,.2,1)',
                transform: selected === i ? 'translateY(-4px)' : '',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={(e) => { if (selected !== i) e.currentTarget.style.borderColor = r.color + '40'; }}
              onMouseLeave={(e) => { if (selected !== i) e.currentTarget.style.borderColor = 'var(--rule)'; }}
            >
              {r.featured && selected !== i && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  padding: '2px 8px', borderRadius: 999, fontSize: 10,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                  border: `1px solid ${r.color}55`, color: r.color,
                  background: `color-mix(in srgb, ${r.color} 10%, transparent)`,
                }}>
                  Recommended
                </div>
              )}
              {selected === i && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  padding: '2px 8px', borderRadius: 999, fontSize: 10,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                  background: r.color, color: 'var(--ink)',
                }}>
                  Selected
                </div>
              )}

              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: selected === i ? r.color : 'var(--paper-4)', marginBottom: 16 }}>
                {r.name}
              </div>
              <div style={{ fontSize: 40, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '-0.03em', color: selected === i ? r.color : 'var(--paper)', marginBottom: 20 }}>
                {r.range}
                <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--paper-4)', marginLeft: 4 }}>APY</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--paper-3)', lineHeight: 1.7, margin: '0 0 24px' }}>{r.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {r.tags.map((tag) => (
                  <div key={tag} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--paper-3)',
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: selected === i ? r.color : 'var(--paper-4)', flexShrink: 0 }} />
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer CTA ─────────────────────────────────────────────────────────

function FooterCTA() {
  return (
    <section style={{ padding: '160px 0 100px', position: 'relative', overflow: 'hidden' }}>
      {/* Large glow */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 700, height: 700,
        background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent), transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ ...shell, position: 'relative', textAlign: 'center' }}>
        <div className="reveal" style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--paper-4)', marginBottom: 28 }}>
            Ready to deploy
          </div>
          <h2 className="display italic" style={{ fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
            Deploy your capital<br />
            <em style={{ color: 'var(--accent)' }}>intelligently.</em>
          </h2>
          <p style={{ fontSize: 18, color: 'var(--paper-2)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 48px' }}>
            Built on Mantle. Verified by ERC-8004.<br />
            Powered by AI. Protected by smart contracts.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <Link href="/app" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              height: 56, padding: '0 32px', borderRadius: 12,
              background: 'var(--accent)', color: 'var(--accent-fg)',
              fontSize: 16, fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 0 60px color-mix(in srgb, var(--accent) 35%, transparent)',
              transition: 'filter 160ms, transform 160ms',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
            >
              Launch App →
            </Link>
          </div>
        </div>

        {/* Bottom credit */}
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span className="display italic" style={{ fontSize: 18, color: 'var(--paper-3)' }}>Equinox RWA</span>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--paper-4)' }}>© 2025 Equinox RWA</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--paper-4)' }}>Built on Mantle</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Root ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let removeSection3VideoMetadataListener: (() => void) | undefined;
    let removeSection3ScrollListener: (() => void) | undefined;

    const ctx = gsap.context(() => {
      // Hero entrance animations
      gsap.from('.hero-eyebrow', {
        y: 20, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.15,
      });
      gsap.from('.hero-title', {
        y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', delay: 0.3,
      });
      gsap.from('.hero-sub', {
        y: 30, opacity: 0, duration: 1.0, ease: 'power2.out', delay: 0.55,
      });
      gsap.from('.hero-ctas', {
        y: 20, opacity: 0, duration: 0.9, ease: 'power2.out', delay: 0.75,
      });
      gsap.from('.hero-stats', {
        y: 16, opacity: 0, duration: 0.9, ease: 'power2.out', delay: 0.95,
      });

      gsap.set('.landing-app-preview', {
        transformPerspective: 1200,
        transformOrigin: 'center bottom',
        rotationY: 0,
        rotationZ: 0,
        skewX: 0,
        skewY: 0,
        rotationX: 6,
        scale: 0.97,
      });
      gsap.to('.landing-app-preview', {
        scrollTrigger: {
          trigger: '.landing-intro-stack',
          start: 'top top',
          end: '+=520',
          scrub: 0.8,
        },
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        skewX: 0,
        skewY: 0,
        scale: 1,
        ease: 'none',
      });

      ScrollTrigger.create({
        trigger: '.landing-overlap-section',
        start: 'bottom bottom',
        end: '+=720',
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
      });

      const section3Video = document.querySelector<HTMLVideoElement>('.landing-section3-scroll-video');
      const section3Wrap = document.querySelector<HTMLElement>('.landing-section3-onward');
      if (section3Video && section3Wrap) {
        section3Video.load();
        section3Video.pause();
        section3Video.currentTime = 0.01;

        let pauseTimer: number | undefined;
        let section3Active = false;

        ScrollTrigger.create({
          trigger: section3Wrap,
          start: 'top bottom',
          end: 'bottom top',
          onEnter: () => { section3Active = true; },
          onEnterBack: () => { section3Active = true; },
          onLeave: () => {
            section3Active = false;
            section3Video.pause();
          },
          onLeaveBack: () => {
            section3Active = false;
            section3Video.pause();
          },
        });

        const playWhileScrolling = () => {
          if (!section3Active) return;

          void section3Video.play().catch(() => undefined);
          if (pauseTimer) window.clearTimeout(pauseTimer);
          pauseTimer = window.setTimeout(() => {
            section3Video.pause();
          }, 130);
        };

        window.addEventListener('scroll', playWhileScrolling, { passive: true });
        removeSection3ScrollListener = () => {
          window.removeEventListener('scroll', playWhileScrolling);
          if (pauseTimer) window.clearTimeout(pauseTimer);
        };

        if (section3Video.readyState >= 1) {
          section3Video.currentTime = 0.01;
        } else {
          const setInitialSection3VideoTime = () => {
            section3Video.currentTime = 0.01;
          };
          section3Video.addEventListener('loadedmetadata', setInitialSection3VideoTime, { once: true });
          removeSection3VideoMetadataListener = () => {
            section3Video.removeEventListener('loadedmetadata', setInitialSection3VideoTime);
          };
        }
      }

      // Scroll-triggered single reveals
      gsap.utils.toArray<Element>('.reveal').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
          y: 36, opacity: 0, duration: 0.85, ease: 'power2.out',
        });
      });

      // Staggered card reveals
      gsap.utils.toArray<Element>('.reveal-stagger').forEach((container) => {
        const children = container.querySelectorAll('.stagger-item');
        gsap.from(children, {
          scrollTrigger: { trigger: container as Element, start: 'top 85%', toggleActions: 'play none none none' },
          y: 36, opacity: 0, duration: 0.75, stagger: 0.1, ease: 'power2.out',
        });
      });
    }, rootRef);

    return () => {
      removeSection3VideoMetadataListener?.();
      removeSection3ScrollListener?.();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="landing-page-root" style={{ background: 'var(--ink)', minHeight: '100vh', color: 'var(--paper)' }}>
      <Nav />
      <div className="landing-intro-stack">
        <Hero />
        <LaunchAppPreview />
      </div>
      <div className="landing-section-2-3-stack">
        <CapitalTopologySection />
      </div>
      <div className="landing-section3-onward">
        <Section3VideoBackground />
        <ProblemSection />
        <FeatureSection />
        <HowItWorksSection />
        <RiskSection />
        <FooterCTA />
      </div>
    </div>
  );
}
