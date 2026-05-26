'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { V2TopBar, MemoHero } from '@/components/v2-hero';
import { BottleCard, RiskDial, DecisionTape, AgentMemoStream } from '@/components/v2-pieces';
import { CapitalTopology } from '@/components/v2-topology';
import { WalletConnectModal, DepositModal, RiskShieldModal } from '@/components/modals';
import { AgentsPage, StrategyPage, HistoryPage } from '@/components/agents-page';
import { Icon } from '@/components/icons';
import { TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect, useTweaks } from '@/components/tweaks-panel';
import {
  ASSETS,
  AGENTS,
  VENUES,
  RISK_PROFILES,
  FEED_LIBRARY,
  seedFeedV2,
  nowStamp,
} from '@/lib/data';
import type { FeedEntry, RiskProfileName } from '@/lib/data';

interface WalletInfo {
  address: string;
  short: string;
  balance: string;
  wallet: string;
}

type ModalKind = 'connect' | 'deposit' | 'shield' | null;
type PageKind = 'portfolio' | 'agents' | 'strategy' | 'history';
type PivotState = 'idle' | 'scanning' | 'bridging' | 'settled';

const TWEAK_DEFAULTS = {
  theme: 'dark' as string,
  accent: '#9DEFC0',
  personality: 'analyst' as string,
  profile: 'Balanced' as RiskProfileName,
};

function softOf(hex: string) {
  return `color-mix(in srgb, ${hex} 18%, transparent)`;
}

export default function AppV2() {
  const [tweak, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { theme, accent, personality, profile } = tweak;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-soft', softOf(accent));
  }, [accent]);

  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [page, setPage] = useState<PageKind>('portfolio');
  const [modal, setModal] = useState<ModalKind>(null);
  const [paused, setPaused] = useState(false);
  const [pivotState, setPivotState] = useState<PivotState>('idle');

  const [feed, setFeed] = useState<FeedEntry[]>(() => seedFeedV2());
  const feedKeyRef = useRef(200);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setFeed(prev => {
        const lib = FEED_LIBRARY;
        const next = { ...lib[Math.floor(Math.random() * lib.length)] };
        next._key = ++feedKeyRef.current;
        next.timestamp = nowStamp();
        next.ago = 'just now';
        return [next, ...prev].slice(0, 18);
      });
    }, 7200);
    return () => clearInterval(t);
  }, [paused]);

  const triggerShield = useCallback(() => {
    setFeed(prev => {
      const guard = { ...FEED_LIBRARY.find(e => e.kind === 'guard')! };
      guard._key = ++feedKeyRef.current;
      guard.timestamp = nowStamp();
      guard.ago = 'just now';
      return [guard, ...prev].slice(0, 18);
    });
    setModal('shield');
  }, []);

  const triggerPivot = useCallback(() => {
    if (pivotState !== 'idle') { setPivotState('idle'); return; }
    setPivotState('scanning');
    setTimeout(() => {
      setPivotState('bridging');
      setFeed(prev => {
        const bridge = { ...FEED_LIBRARY.find(e => e.kind === 'bridge')! };
        bridge._key = ++feedKeyRef.current;
        bridge.timestamp = nowStamp();
        bridge.ago = 'just now';
        return [bridge, ...prev].slice(0, 18);
      });
      setTimeout(() => setPivotState('settled'), 2800);
    }, 900);
  }, [pivotState]);

  const assets = useMemo(() => {
    const targets = RISK_PROFILES[profile].target;
    return ASSETS.map(a => ({ ...a, weight: targets[a.id] ?? a.weight }));
  }, [profile]);

  const navValue = useMemo(() =>
    assets.reduce((s, a) => s + a.balance * a.price, 0),
    [assets]
  );

  const yourAgent = AGENTS.find(a => a.isYou)!;

  const memo = useMemo(() => {
    const latest = feed.find(e => e.kind === 'rebalance') || feed[0];
    return {
      no: '412',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      kind: 'Rebalance',
      delta: '4.2% of capital',
      from: 'USDY',
      to: 'mETH',
      body: latest.body,
      tx: latest.tx || '0x9a2c…f4b1',
    };
  }, [feed]);

  return (
    <>
      <div className="shell">
        <V2TopBar
          wallet={wallet}
          onConnect={() => setModal('connect')}
          onDisconnect={() => setWallet(null)}
          page={page}
          setPage={(p) => setPage(p as PageKind)}
        />

        {page === 'portfolio' && (
          <>
            <MemoHero
              memo={memo}
              navValue={navValue}
              change24={1.84}
              ytd={9.42}
              agent={yourAgent}
              profile={profile}
            />

            <section className="section">
              <CapitalTopology
                assets={assets}
                venues={VENUES}
                pivotState={pivotState}
                onPivot={triggerPivot}
                profile={profile}
                paused={paused}
              />
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Positions, by class</h2>
                  <div className="eyebrow" style={{ marginTop: 8 }}>
                    {assets.length} assets · weighted APY {assets.reduce((s, a) => s + a.weight * a.apy, 0).toFixed(2)}%
                  </div>
                </div>
                <button className="btn btn-outline" onClick={() => setModal('deposit')}>
                  <Icon name="plus" size={13} /> Adjust position
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                {assets.map(a => <BottleCard key={a.id} asset={a} />)}
              </div>
            </section>

            <section className="section" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) 360px', gap: 32 }}>
              {/* Agent reasoning */}
              <div>
                <div className="section-head" style={{ marginBottom: 24 }}>
                  <div>
                    <h2>Agent reasoning</h2>
                    <div className="eyebrow" style={{ marginTop: 8 }}>
                      Streaming · {personality === 'terminal' ? 'telemetry' : 'analyst memo'} · ERC-8004 logged
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => setPaused(p => !p)}>
                      <Icon name={paused ? 'play' : 'pause'} size={12} /> {paused ? 'Resume' : 'Pause'}
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={triggerShield}>
                      <Icon name="shield" size={12} color="var(--negative)" /> Trigger shield
                    </button>
                  </div>
                </div>
                <AgentMemoStream entries={feed} personality={personality} limit={5} />
              </div>

              {/* Risk dial */}
              <div style={{ paddingTop: 70 }}>
                <RiskDial
                  profile={profile}
                  setProfile={(p) => setTweak({ profile: p as RiskProfileName })}
                  profiles={RISK_PROFILES}
                  assets={assets}
                />
              </div>
            </section>
          </>
        )}

        {page === 'agents' && (
          <section style={{ paddingTop: 36 }}>
            <AgentsPage agents={AGENTS} selected={yourAgent} onSelect={() => {}} />
          </section>
        )}
        {page === 'strategy' && (
          <section style={{ paddingTop: 36 }}>
            <StrategyPage venues={VENUES} profile={profile} profiles={RISK_PROFILES} />
          </section>
        )}
        {page === 'history' && (
          <section style={{ paddingTop: 36 }}>
            <HistoryPage entries={feed} />
          </section>
        )}
      </div>

      {/* Ticker tape */}
      <div style={{ position: 'sticky', bottom: 0, zIndex: 40, background: 'var(--ink)' }}>
        <DecisionTape entries={feed.slice(0, 12)} />
      </div>

      {/* Modals */}
      {modal === 'connect' && (
        <WalletConnectModal
          onClose={() => setModal(null)}
          onConnect={(w) => { setWallet(w); setModal('deposit'); }}
        />
      )}
      {modal === 'deposit' && (
        <DepositModal
          onClose={() => setModal(null)}
          profile={profile}
          setProfile={(p) => setTweak({ profile: p as RiskProfileName })}
          profiles={RISK_PROFILES}
          onDeposit={() => setModal(null)}
        />
      )}
      {modal === 'shield' && (
        <RiskShieldModal
          onClose={() => setModal(null)}
          attempted={{ asset: 'fBTC', weight: 0.38 }}
          profile={profile}
          profiles={RISK_PROFILES}
        />
      )}

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakRadio
          label="Theme"
          value={theme}
          options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
          onChange={v => setTweak({ theme: v })}
        />
        <TweakColor
          label="Accent"
          value={accent}
          options={['#9DEFC0', '#B4A0FF', '#F5C76B', '#7EBDF2', '#F09A82']}
          onChange={v => setTweak({ accent: v })}
        />
        <TweakSection label="Agent" />
        <TweakSelect
          label="Personality"
          value={personality}
          options={[
            { value: 'analyst', label: 'Analyst memo' },
            { value: 'terminal', label: 'Terminal log' },
          ]}
          onChange={v => setTweak({ personality: v })}
        />
        <TweakSelect
          label="Risk profile"
          value={profile}
          options={[
            { value: 'Conservative', label: 'Conservative' },
            { value: 'Balanced', label: 'Balanced' },
            { value: 'Aggressive', label: 'Aggressive' },
          ]}
          onChange={v => setTweak({ profile: v as RiskProfileName })}
        />
      </TweaksPanel>
    </>
  );
}
