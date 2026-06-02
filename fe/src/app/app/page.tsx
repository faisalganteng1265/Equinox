'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import type { Address } from 'viem';

import { AgentsPage, HistoryPage, StrategyPage } from '@/components/agents-page';
import { Icon } from '@/components/icons';
import { FaucetModal, RiskShieldModal, VaultActionModal } from '@/components/modals';
import { BottleCard, DecisionTape, RiskDial, AgentMemoStream } from '@/components/v2-pieces';
import { V2TopBar, MemoHero } from '@/components/v2-hero';
import { CapitalTopology } from '@/components/v2-topology';
import { WalletButton } from '@/components/wallet-button';
import { TweaksPanel, TweakColor, TweakRadio, TweakSection, TweakSelect, useTweaks } from '@/components/tweaks-panel';
import { equinoxApi } from '@/lib/equinox-api';
import { vaultAbi } from '@/lib/abis';
import { expectedChainId } from '@/lib/chains';
import {
  buildDecisionFeed,
  buildPrimaryAgent,
  buildRiskProfilesFromPortfolio,
  buildUiAssets,
  buildUiVenues,
  profileCodes,
  walletLabel,
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
const PROFILE_OPTIONS: RiskProfileName[] = ['Conservative', 'Balanced', 'Aggressive'];

function softOf(hex: string) {
  return `color-mix(in srgb, ${hex} 18%, transparent)`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function FullscreenStatus({
  tone = 'loading',
  title,
  body,
  onRetry,
}: {
  tone?: 'loading' | 'error';
  title: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <div className="shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div className="display italic" style={{ fontSize: 36 }}>Equinox RWA</div>
        <div className="eyebrow" style={{ marginTop: 12, color: tone === 'error' ? 'var(--negative)' : 'var(--paper-3)' }}>
          {title}
        </div>
        <p style={{ margin: '12px 0 0', color: 'var(--paper-2)', fontSize: 13, lineHeight: 1.6 }}>{body}</p>
        {onRetry ? (
          <button className="btn btn-primary" onClick={onRetry} type="button" style={{ marginTop: 18 }}>
            <Icon name="swap" size={13} /> Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

function InlineStatus({
  tone,
  children,
}: {
  tone: 'info' | 'error' | 'warn';
  children: React.ReactNode;
}) {
  const color = tone === 'error' ? 'var(--negative)' : tone === 'warn' ? 'var(--warning)' : 'var(--info)';
  return (
    <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 10, border: `1px solid ${color}`, color, background: `color-mix(in srgb, ${color} 10%, transparent)`, fontSize: 12, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

export default function AppV2() {
  const [tweak, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { theme, accent, personality, profile } = tweak;
  const { address, chainId, isConnected } = useAccount();
  const [page, setPage] = useState<PageKind>('portfolio');
  const [isPagePending, startPageTransition] = useTransition();
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const paused = false;
  const [actionBusy, setActionBusy] = useState<'profile' | null>(null);
  const [creatingVault, setCreatingVault] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const shieldAttempt = { asset: 'fBTC', weight: 0.38 };
  const [localFeed, setLocalFeed] = useState<FeedEntry[]>([]);
  const lastSyncedRemoteProfile = useRef<RiskProfileName | null>(null);
  const publicClient = usePublicClient({ chainId: expectedChainId });
  const { data: walletClient } = useWalletClient();

  const accountQuery = useQuery({
    queryKey: ['equinox-account', address],
    queryFn: () => equinoxApi.getVaultAccount(address!),
    enabled: Boolean(address),
    refetchInterval: 15_000,
  });

  const hasUserVault = !address || accountQuery.data?.hasVault === true;
  const isKnownMissingVault = Boolean(address && accountQuery.data && !accountQuery.data.hasVault);

  const contractsQuery = useQuery({
    queryKey: ['equinox-contracts', address],
    queryFn: () => equinoxApi.getContracts(address),
    enabled: !address || Boolean(accountQuery.data?.hasVault),
  });

  const portfolioQuery = useQuery({
    queryKey: ['equinox-portfolio', address],
    queryFn: () => equinoxApi.getPortfolio(address),
    enabled: Boolean(hasUserVault),
    refetchInterval: 15_000,
  });

  const agentQuery = useQuery({
    queryKey: ['equinox-agent', portfolioQuery.data?.vault.agentId],
    queryFn: () => equinoxApi.getAgent(portfolioQuery.data!.vault.agentId),
    enabled: Boolean(portfolioQuery.data?.vault.agentId),
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
    if (remoteProfile && lastSyncedRemoteProfile.current !== remoteProfile) {
      lastSyncedRemoteProfile.current = remoteProfile;
      setTweak({ profile: remoteProfile });
    }
  }, [portfolioQuery.data?.vault.currentRiskProfile, setTweak]);

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
  const feed = useMemo(
    () => [...localFeed, ...onChainFeed]
      .sort((left, right) => (right.occurredAt ?? 0) - (left.occurredAt ?? 0))
      .slice(0, 18),
    [localFeed, onChainFeed],
  );
  const deferredFeed = useDeferredValue(feed);
  const weightedApy = useMemo(
    () => assets.reduce((sum, asset) => sum + asset.weight * asset.apy, 0),
    [assets],
  );
  const navValue = Number(portfolioQuery.data?.vault.totalPortfolioValueFormatted || 0);
  const selectedProfileCode = profileCodes[profile];
  const remoteProfileCode = portfolioQuery.data?.vault.currentRiskProfileCode;
  const hasPendingProfile = remoteProfileCode != null && selectedProfileCode !== remoteProfileCode;

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
    const occurredAt = Date.now();
    setLocalFeed((current) => [
      {
        ...entry,
        _key: occurredAt + current.length,
        timestamp: entry.timestamp || nowStamp(),
        occurredAt: entry.occurredAt ?? occurredAt,
        ago: 'just now',
      },
      ...current,
    ].slice(0, 8));
  }, []);

  const refreshLiveData = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);

    try {
      await Promise.all([
        accountQuery.refetch(),
        portfolioQuery.refetch(),
        agentQuery.refetch(),
        contractsQuery.refetch(),
      ]);
    } catch (error) {
      setRefreshError(errorMessage(error, 'Failed to refresh live data.'));
    } finally {
      setRefreshing(false);
    }
  }, [accountQuery, agentQuery, contractsQuery, portfolioQuery]);

  const createDemoPortfolio = useCallback(async () => {
    if (!address) {
      return;
    }

    setCreatingVault(true);
    setActionError(null);

    try {
      await equinoxApi.createVault({
        owner: address,
        agentUri: `equinox://demo-agent/${address.toLowerCase()}`,
      });
      await refreshLiveData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to create demo portfolio.');
    } finally {
      setCreatingVault(false);
    }
  }, [address, refreshLiveData]);

  useEffect(() => {
    if (isKnownMissingVault && !creatingVault) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void createDemoPortfolio();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKnownMissingVault]);

  const applyRiskProfile = useCallback(async () => {
    if (!contractsQuery.data || !portfolioQuery.data || !walletClient || !publicClient || !address) {
      setActionError('Connect your owner wallet before applying the risk profile.');
      return;
    }

    const vaultOwner = portfolioQuery.data.vault.owner.toLowerCase();
    if (address.toLowerCase() !== vaultOwner) {
      setActionError(`Only the vault owner ${walletLabel(portfolioQuery.data.vault.owner)} can change the risk profile.`);
      return;
    }

    if (chainId && chainId !== expectedChainId) {
      setActionError('Switch to Mantle Sepolia before applying the risk profile.');
      return;
    }

    setActionBusy('profile');
    setActionError(null);

    try {
      const hash = await walletClient.writeContract({
        address: contractsQuery.data.core.vault as Address,
        abi: vaultAbi,
        functionName: 'setRiskProfile',
        args: [profileCodes[profile]],
        chain: publicClient.chain,
        account: address,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      addLocalFeed({
        kind: 'rebalance',
        title: `${profile} profile applied`,
        body: `Vault risk profile updated on-chain. Autonomous strategy cycles will now use ${profile} guardrails.`,
        venue: 'Owner wallet',
        delta: profile,
        tx: hash,
        txUrl: `${contractsQuery.data.chain.explorerUrl.replace(/\/$/, '')}/tx/${hash}`,
      });
      await refreshLiveData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to apply risk profile.');
    } finally {
      setActionBusy(null);
    }
  }, [addLocalFeed, address, chainId, contractsQuery.data, portfolioQuery.data, profile, publicClient, refreshLiveData, walletClient]);

  const bootError = accountQuery.error || contractsQuery.error || (isKnownMissingVault ? null : portfolioQuery.error || agentQuery.error);
  if (bootError) {
    return (
      <FullscreenStatus
        tone="error"
        title="Unable to load Mantle Sepolia state"
        body={errorMessage(bootError, 'The frontend could not read the Equinox backend or chain state.')}
        onRetry={() => void refreshLiveData()}
      />
    );
  }

  if (contractsQuery.isLoading || (address && accountQuery.isLoading) || portfolioQuery.isLoading || agentQuery.isLoading) {
    return (
      <FullscreenStatus
        title="Loading Mantle Sepolia portfolio"
        body="Reading contract addresses, vault balances, strategy adapters, and agent registry state."
      />
    );
  }

  if (isKnownMissingVault) {
    if (actionError) {
      return (
        <FullscreenStatus
          tone="error"
          title="Vault creation failed"
          body={actionError}
          onRetry={() => void createDemoPortfolio()}
        />
      );
    }
    return (
      <FullscreenStatus
        title="Setting up your portfolio"
        body="Creating a vault and agent identity for this wallet on Mantle Sepolia."
      />
    );
  }

  if (!primaryAgent) {
    return (
      <FullscreenStatus
        tone="error"
        title="Agent state unavailable"
        body="The backend responded, but the live agent snapshot could not be mapped into the dashboard."
        onRetry={() => void refreshLiveData()}
      />
    );
  }

  const canOpenVaultModal = Boolean(contractsQuery.data && portfolioQuery.data);

  return (
    <>
      <div className="shell" style={{ paddingBottom: 88 }}>
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
                refreshing={refreshing}
                profile={profile}
                paused={paused}
              />
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Positions, by class</h2>
                  <div className="eyebrow" style={{ marginTop: 8 }}>
                    {assets.length} assets | weighted APY {weightedApy.toFixed(2)}%
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    flex: '1 1 360px',
                    flexWrap: 'wrap',
                    padding: '0 18px',
                  }}
                >
                  <span className="eyebrow" style={{ color: 'var(--paper-3)' }}>Strategy</span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: 3,
                      border: '1px solid var(--rule)',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--ink-2)',
                    }}
                  >
                    {PROFILE_OPTIONS.map((option) => {
                      const active = profile === option;
                      return (
                        <button
                          key={option}
                          className="btn btn-sm"
                          onClick={() => setTweak({ profile: option })}
                          type="button"
                          style={{
                            minWidth: 96,
                            borderColor: active ? 'var(--accent)' : 'transparent',
                            background: active ? 'var(--accent-soft)' : 'transparent',
                            color: active ? 'var(--accent)' : 'var(--paper-2)',
                          }}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {hasPendingProfile ? (
                    <button className="btn btn-sm btn-primary" onClick={() => void applyRiskProfile()} type="button" disabled={actionBusy !== null}>
                      {actionBusy === 'profile' ? 'Applying...' : 'Apply'}
                    </button>
                  ) : null}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" onClick={() => canOpenVaultModal && setModal('withdraw')} type="button">
                      <Icon name="minus" size={13} /> Withdraw
                    </button>
                    <button className="btn btn-primary" onClick={() => canOpenVaultModal && setModal('deposit')} type="button">
                      <Icon name="plus" size={13} /> Deposit
                    </button>
                  </div>
                  {portfolioQuery.isFetching && !refreshing ? (
                    <div
                      className="eyebrow"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--paper-3)',
                        paddingLeft: 10,
                      }}
                    >
                      <Icon name="swap" size={11} color="var(--info)" />
                      Refreshing
                    </div>
                  ) : null}
                </div>
              </div>
              {refreshError ? <InlineStatus tone="error">{refreshError}</InlineStatus> : null}
              {assets.length > 0 ? (
                <div className="asset-grid">
                  {assets.map((asset) => (
                    <BottleCard key={asset.id} asset={asset} />
                  ))}
                </div>
              ) : (
                <InlineStatus tone="warn">No supported assets were returned by the backend.</InlineStatus>
              )}
            </section>

            <section className="section reason-grid">
              <div>
                <div className="section-head" style={{ marginBottom: 24 }}>
                  <div>
                    <h2>Agent reasoning</h2>
                    <div className="eyebrow" style={{ marginTop: 8 }}>
                      Streaming | {personality === 'terminal' ? 'telemetry' : 'analyst memo'} | ERC-8004 logged
                    </div>
                  </div>
                </div>
                {actionError ? (
                  <InlineStatus tone="error">{actionError}</InlineStatus>
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
                {hasPendingProfile ? (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span className="eyebrow" style={{ color: 'var(--paper-3)' }}>
                      Vault is {portfolioQuery.data?.vault.currentRiskProfile}; selected {profile}
                    </span>
                    <button className="btn btn-sm btn-primary" onClick={() => void applyRiskProfile()} type="button" disabled={actionBusy !== null}>
                      {actionBusy === 'profile' ? 'Applying...' : 'Apply profile'}
                    </button>
                  </div>
                ) : null}
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
              explorerBaseUrl={contractsQuery.data!.chain.explorerUrl}
              agentRegistryAddress={contractsQuery.data!.core.agentRegistry}
            />
          </section>
        ) : null}

        {page === 'strategy' ? (
          <section style={{ paddingTop: 36 }}>
            <StrategyPage
              venues={venues}
              profile={profile}
              profiles={liveProfiles}
              explorerBaseUrl={contractsQuery.data!.chain.explorerUrl}
            />
          </section>
        ) : null}

        {page === 'history' ? (
          <section style={{ paddingTop: 36 }}>
            <HistoryPage entries={deferredFeed} />
          </section>
        ) : null}
      </div>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, background: 'var(--ink)' }}>
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
          Wallet {isConnected ? 'connected' : 'disconnected'} | Page {isPagePending ? 'updating' : page}
        </div>
        <div className="eyebrow" style={{ color: 'var(--paper-3)' }}>
          Owner {portfolioQuery.data ? walletLabel(portfolioQuery.data.vault.owner) : 'loading'} | Connected {walletLabel(address)}
        </div>
      </TweaksPanel>
    </>
  );
}
