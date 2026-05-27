'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { AgentsPage, HistoryPage, StrategyPage } from '@/components/agents-page';
import { Icon } from '@/components/icons';
import { FaucetModal, RiskShieldModal, VaultActionModal } from '@/components/modals';
import { BottleCard, DecisionTape, RiskDial, AgentMemoStream } from '@/components/v2-pieces';
import { V2TopBar, MemoHero } from '@/components/v2-hero';
import { CapitalTopology } from '@/components/v2-topology';
import { WalletButton } from '@/components/wallet-button';
import { TweaksPanel, TweakColor, TweakRadio, TweakSection, TweakSelect, useTweaks } from '@/components/tweaks-panel';
import { equinoxApi } from '@/lib/equinox-api';
import {
  assetAddressForKey,
  buildBlockedTargets,
  buildDecisionFeed,
  buildPreviewFeed,
  buildPrimaryAgent,
  buildProfileTargets,
  buildRiskProfilesFromPortfolio,
  buildUiAssets,
  buildUiVenues,
} from '@/lib/equinox-ui';
import { RISK_PROFILES, buildSparkSeries, nowStamp, type FeedEntry, type RiskProfileName } from '@/lib/data';

type ModalKind = 'deposit' | 'withdraw' | 'faucet' | 'shield' | null;
type PageKind = 'portfolio' | 'agents' | 'strategy' | 'history';

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
  const { address, chainId, isConnected } = useAccount();
  const [page, setPage] = useState<PageKind>('portfolio');
  const [isPagePending, startPageTransition] = useTransition();
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [paused, setPaused] = useState(false);
  const [actionBusy, setActionBusy] = useState<'preview' | 'execute' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shieldAttempt, setShieldAttempt] = useState<{ asset: string; weight: number }>({ asset: 'fBTC', weight: 0.38 });
  const [localFeed, setLocalFeed] = useState<FeedEntry[]>([]);

  const contractsQuery = useQuery({
    queryKey: ['equinox-contracts'],
    queryFn: () => equinoxApi.getContracts(),
  });

  const portfolioQuery = useQuery({
    queryKey: ['equinox-portfolio'],
    queryFn: () => equinoxApi.getPortfolio(),
    refetchInterval: 15_000,
  });

  const agentQuery = useQuery({
    queryKey: ['equinox-agent', contractsQuery.data?.core.agentId],
    queryFn: () => equinoxApi.getAgent(contractsQuery.data!.core.agentId),
    enabled: Boolean(contractsQuery.data?.core.agentId),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-soft', softOf(accent));
  }, [accent]);

  useEffect(() => {
    const remoteProfile = portfolioQuery.data?.vault.currentRiskProfile;
    if (remoteProfile && remoteProfile !== profile && localFeed.length === 0) {
      setTweak({ profile: remoteProfile });
    }
  }, [localFeed.length, portfolioQuery.data?.vault.currentRiskProfile, profile, setTweak]);

  const assets = useMemo(
    () => (portfolioQuery.data ? buildSparkSeries(buildUiAssets(portfolioQuery.data)) : []),
    [portfolioQuery.data],
  );
  const venues = useMemo(
    () => (portfolioQuery.data ? buildUiVenues(portfolioQuery.data) : []),
    [portfolioQuery.data],
  );
  const liveProfiles = useMemo(
    () => (portfolioQuery.data ? buildRiskProfilesFromPortfolio(portfolioQuery.data) : RISK_PROFILES),
    [portfolioQuery.data],
  );
  const primaryAgent = useMemo(() => {
    if (!portfolioQuery.data || !agentQuery.data) {
      return null;
    }

    return buildPrimaryAgent(agentQuery.data, portfolioQuery.data, profile);
  }, [agentQuery.data, portfolioQuery.data, profile]);
  const agents = useMemo(() => {
    if (!primaryAgent) {
      return [];
    }

    return [primaryAgent];
  }, [primaryAgent]);
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) || primaryAgent || agents[0] || null,
    [agents, primaryAgent, selectedAgentId],
  );

  const onChainFeed = useMemo(() => (agentQuery.data ? buildDecisionFeed(agentQuery.data) : []), [agentQuery.data]);
  const feed = useMemo(() => [...localFeed, ...onChainFeed].slice(0, 18), [localFeed, onChainFeed]);
  const deferredFeed = useDeferredValue(feed);
  const weightedApy = useMemo(
    () => assets.reduce((sum, asset) => sum + asset.weight * asset.apy, 0),
    [assets],
  );
  const navValue = Number(portfolioQuery.data?.vault.totalPortfolioValueFormatted || 0);

  const memo = useMemo(() => {
    const latest = deferredFeed.find((entry) => entry.kind === 'rebalance') || deferredFeed[0];

    return {
      no: String(agentQuery.data?.decisionCount || 0),
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      kind: latest?.kind === 'guard' ? 'Guardrail' : 'Rebalance',
      delta: latest?.delta || '0.0%',
      from: 'USDY',
      to: 'mETH',
      body: latest?.body || 'Waiting for the latest agent decision from Mantle.',
      tx: latest?.tx || '0x0',
    };
  }, [agentQuery.data?.decisionCount, deferredFeed]);

  const addLocalFeed = useCallback((entry: FeedEntry) => {
    setLocalFeed((current) => [
      {
        ...entry,
        _key: Date.now() + current.length,
        timestamp: entry.timestamp || nowStamp(),
        ago: 'just now',
      },
      ...current,
    ].slice(0, 8));
  }, []);

  const refreshLiveData = useCallback(async () => {
    await Promise.all([
      portfolioQuery.refetch(),
      agentQuery.refetch(),
      contractsQuery.refetch(),
    ]);
  }, [agentQuery, contractsQuery, portfolioQuery]);

  const triggerShield = useCallback(async () => {
    if (!contractsQuery.data) {
      return;
    }

    setActionBusy('reject');
    setActionError(null);

    try {
      const result = await equinoxApi.rejectRebalance({
        targets: buildBlockedTargets(contractsQuery.data),
        reasoning: {
          source: 'frontend',
          mode: 'guardrail-demo',
          profile,
        },
        detailsUri: `equinox://frontend/reject/${Date.now()}`,
      });

      setShieldAttempt({
        asset: result.preview.offendingAssetKey || 'fBTC',
        weight: result.preview.attemptedWeightBps / 10_000,
      });
      addLocalFeed({
        kind: 'guard',
        title: 'Blocked decision recorded on-chain',
        body: `Rejected decision logged with reasoning hash ${result.reasoningHash.slice(0, 10)}…`,
        venue: 'Risk Guardrail',
        delta: 'blocked',
        tx: result.receipt.transactionHash,
        txUrl: result.receipt.explorerUrl,
      });
      setModal('shield');
      await refreshLiveData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to record rejected decision.');
    } finally {
      setActionBusy(null);
    }
  }, [addLocalFeed, contractsQuery.data, profile, refreshLiveData]);

  const previewCurrentPlan = useCallback(async () => {
    if (!contractsQuery.data) {
      return;
    }

    setActionBusy('preview');
    setActionError(null);

    try {
      const preview = await equinoxApi.previewRebalance({
        targets: buildProfileTargets(contractsQuery.data, liveProfiles[profile].target),
      });

      addLocalFeed(buildPreviewFeed(preview, profile));
      if (!preview.preview.ok) {
        setShieldAttempt({
          asset: preview.preview.offendingAssetKey || 'fBTC',
          weight: preview.preview.attemptedWeightBps / 10_000,
        });
        setModal('shield');
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Preview request failed.');
    } finally {
      setActionBusy(null);
    }
  }, [addLocalFeed, contractsQuery.data, liveProfiles, profile]);

  const executeCurrentPlan = useCallback(async () => {
    if (!contractsQuery.data) {
      return;
    }

    setActionBusy('execute');
    setActionError(null);

    try {
      const result = await equinoxApi.executeRebalance({
        targets: buildProfileTargets(contractsQuery.data, liveProfiles[profile].target),
        reasoning: {
          source: 'frontend',
          mode: 'execute-profile',
          profile,
          wallet: address,
        },
        detailsUri: `equinox://frontend/execute/${Date.now()}`,
      });

      addLocalFeed({
        kind: 'rebalance',
        title: `${profile} targets executed`,
        body: `Authorized backend agent executed a rebalance and wrote tx ${result.receipt.transactionHash.slice(0, 10)}… on Mantle.`,
        venue: 'Backend agent',
        delta: `${result.preview.totalWeightBps / 100}% target`,
        tx: result.receipt.transactionHash,
        txUrl: result.receipt.explorerUrl,
      });
      await refreshLiveData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Execute request failed.');
    } finally {
      setActionBusy(null);
    }
  }, [addLocalFeed, address, contractsQuery.data, liveProfiles, profile, refreshLiveData]);

  if (contractsQuery.isLoading || portfolioQuery.isLoading || agentQuery.isLoading || !primaryAgent) {
    return (
      <div className="shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="display italic" style={{ fontSize: 36 }}>Equinox RWA</div>
          <div className="eyebrow" style={{ marginTop: 12 }}>Loading Mantle Sepolia portfolio…</div>
        </div>
      </div>
    );
  }

  const canOpenVaultModal = Boolean(contractsQuery.data && portfolioQuery.data);

  return (
    <>
      <div className="shell">
        <V2TopBar
          walletSlot={(
            <>
              <button
                className="btn btn-outline"
                onClick={() => setModal('faucet')}
                type="button"
                disabled={!portfolioQuery.data}
              >
                <Icon name="plus" size={13} /> Faucet
              </button>
              <WalletButton />
            </>
          )}
          page={page}
          setPage={(nextPage) => startPageTransition(() => setPage(nextPage as PageKind))}
        />

        {page === 'portfolio' ? (
          <>
            <MemoHero
              memo={memo}
              navValue={navValue}
              change24={Math.max(0.12, weightedApy / 3)}
              ytd={Math.max(1.2, weightedApy * 1.9)}
              agent={primaryAgent}
              profile={profile}
            />

            <section className="section">
              <CapitalTopology
                assets={assets}
                venues={venues}
                onRefresh={() => void refreshLiveData()}
                profile={profile}
                paused={paused}
              />
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Positions, by class</h2>
                  <div className="eyebrow" style={{ marginTop: 8 }}>
                    {assets.length} assets · weighted APY {weightedApy.toFixed(2)}%
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline" onClick={() => canOpenVaultModal && setModal('withdraw')} type="button">
                    <Icon name="minus" size={13} /> Withdraw
                  </button>
                  <button className="btn btn-primary" onClick={() => canOpenVaultModal && setModal('deposit')} type="button">
                    <Icon name="plus" size={13} /> Deposit
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                {assets.map((asset) => (
                  <BottleCard key={asset.id} asset={asset} />
                ))}
              </div>
            </section>

            <section className="section" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) 360px', gap: 32 }}>
              <div>
                <div className="section-head" style={{ marginBottom: 24 }}>
                  <div>
                    <h2>Agent reasoning</h2>
                    <div className="eyebrow" style={{ marginTop: 8 }}>
                      Streaming · {personality === 'terminal' ? 'telemetry' : 'analyst memo'} · ERC-8004 logged
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => setPaused((value) => !value)} type="button">
                      <Icon name={paused ? 'play' : 'pause'} size={12} /> {paused ? 'Resume' : 'Pause'}
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => void previewCurrentPlan()} type="button" disabled={actionBusy !== null}>
                      {actionBusy === 'preview' ? 'Previewing…' : 'Preview plan'}
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => void executeCurrentPlan()} type="button" disabled={actionBusy !== null}>
                      {actionBusy === 'execute' ? 'Executing…' : 'Execute plan'}
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => void triggerShield()} type="button" disabled={actionBusy !== null}>
                      <Icon name="shield" size={12} color="var(--negative)" /> {actionBusy === 'reject' ? 'Recording…' : 'Record blocked'}
                    </button>
                  </div>
                </div>
                {actionError ? (
                  <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--negative)', color: 'var(--negative)', background: 'color-mix(in srgb, var(--negative) 10%, transparent)' }}>
                    {actionError}
                  </div>
                ) : null}
                <AgentMemoStream entries={deferredFeed} personality={personality} limit={5} />
              </div>

              <div style={{ paddingTop: 70 }}>
                <RiskDial
                  profile={profile}
                  setProfile={(nextProfile) => setTweak({ profile: nextProfile as RiskProfileName })}
                  profiles={liveProfiles}
                  assets={assets}
                />
              </div>
            </section>
          </>
        ) : null}

        {page === 'agents' ? (
          <section style={{ paddingTop: 36 }}>
            <AgentsPage
              agents={agents}
              selected={selectedAgent}
              onSelect={(agent) => setSelectedAgentId(agent.id)}
            />
          </section>
        ) : null}

        {page === 'strategy' ? (
          <section style={{ paddingTop: 36 }}>
            <StrategyPage venues={venues} profile={profile} profiles={liveProfiles} />
          </section>
        ) : null}

        {page === 'history' ? (
          <section style={{ paddingTop: 36 }}>
            <HistoryPage entries={deferredFeed} />
          </section>
        ) : null}
      </div>

      <div style={{ position: 'sticky', bottom: 0, zIndex: 40, background: 'var(--ink)' }}>
        <DecisionTape entries={deferredFeed.slice(0, 12)} />
      </div>

      {modal === 'deposit' && contractsQuery.data && portfolioQuery.data ? (
        <VaultActionModal
          mode="deposit"
          onClose={() => setModal(null)}
          onComplete={() => void refreshLiveData()}
          contracts={contractsQuery.data}
          portfolio={portfolioQuery.data}
          profile={profile}
          setProfile={(nextProfile) => setTweak({ profile: nextProfile })}
          profiles={liveProfiles}
          walletAddress={address}
          chainId={chainId}
        />
      ) : null}

      {modal === 'withdraw' && contractsQuery.data && portfolioQuery.data ? (
        <VaultActionModal
          mode="withdraw"
          onClose={() => setModal(null)}
          onComplete={() => void refreshLiveData()}
          contracts={contractsQuery.data}
          portfolio={portfolioQuery.data}
          profile={profile}
          setProfile={(nextProfile) => setTweak({ profile: nextProfile })}
          profiles={liveProfiles}
          walletAddress={address}
          chainId={chainId}
        />
      ) : null}

      {modal === 'faucet' && portfolioQuery.data ? (
        <FaucetModal
          onClose={() => setModal(null)}
          onComplete={() => void refreshLiveData()}
          onDeposit={() => setModal('deposit')}
          portfolio={portfolioQuery.data}
          walletAddress={address}
        />
      ) : null}

      {modal === 'shield' ? (
        <RiskShieldModal
          onClose={() => setModal(null)}
          attempted={shieldAttempt}
          profile={profile}
          profiles={liveProfiles}
        />
      ) : null}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakRadio
          label="Theme"
          value={theme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
          onChange={(value) => setTweak({ theme: value })}
        />
        <TweakColor
          label="Accent"
          value={accent}
          options={['#9DEFC0', '#B4A0FF', '#F5C76B', '#7EBDF2', '#F09A82']}
          onChange={(value) => setTweak({ accent: value })}
        />
        <TweakSection label="Agent" />
        <TweakSelect
          label="Personality"
          value={personality}
          options={[
            { value: 'analyst', label: 'Analyst memo' },
            { value: 'terminal', label: 'Terminal log' },
          ]}
          onChange={(value) => setTweak({ personality: value })}
        />
        <TweakSelect
          label="Risk profile"
          value={profile}
          options={[
            { value: 'Conservative', label: 'Conservative' },
            { value: 'Balanced', label: 'Balanced' },
            { value: 'Aggressive', label: 'Aggressive' },
          ]}
          onChange={(value) => setTweak({ profile: value as RiskProfileName })}
        />
        <TweakSection label="Status" />
        <div className="eyebrow" style={{ color: 'var(--paper-3)' }}>
          Wallet {isConnected ? 'connected' : 'disconnected'} · Page {isPagePending ? 'updating' : page}
        </div>
        <div className="eyebrow" style={{ color: 'var(--paper-3)' }}>
          Vault owner {portfolioQuery.data ? assetAddressForKey(contractsQuery.data!, portfolioQuery.data.assets[0]?.key || 'USDY') ? 'ready' : 'n/a' : 'loading'}
        </div>
      </TweaksPanel>
    </>
  );
}
