'use client';

import { useEffect, useMemo, useState } from 'react';
import { encodeFunctionData, formatUnits, parseUnits, type Address } from 'viem';
import { usePublicClient, useReadContract, useWalletClient } from 'wagmi';

import { expectedChainId } from '@/lib/chains';
import type { RiskProfileName, RiskProfiles } from '@/lib/data';
import { erc20Abi, vaultAbi } from '@/lib/abis';
import { equinoxApi } from '@/lib/equinox-api';
import { assetAddressForKey, profileCodes, walletLabel } from '@/lib/equinox-ui';
import type { ContractsResponse, PortfolioResponse } from '@/lib/equinox-types';

import { Icon } from './icons';

type VaultModalMode = 'deposit' | 'withdraw';

interface GasEstimate {
  totalGasCostEth: string;
}

interface TxStatus {
  label: string;
  hash?: string;
  explorerUrl?: string;
  blockNumber?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

function Modal({ onClose, children, width = 560 }: {
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
  return (
    <div style={{ padding: '20px 22px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{title}</h3>
        {sub ? <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-mute)' }}>{sub}</p> : null}
      </div>
      <button className="btn btn-ghost btn-icon" onClick={onClose} type="button">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

function StepBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
      {[1, 2, 3].map((value) => (
        <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: value === 3 ? 0 : 1 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: step >= value ? 'var(--accent)' : 'var(--surface-3)',
              color: step >= value ? 'var(--accent-fg)' : 'var(--text-mute)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {step > value ? '✓' : value}
          </div>
          <span style={{ fontSize: 12, color: step >= value ? 'var(--text)' : 'var(--text-dim)' }}>
            {value === 1 ? 'Configure' : value === 2 ? 'Review' : 'Submit'}
          </span>
          {value !== 3 ? <div style={{ flex: 1, height: 1, background: step > value ? 'var(--accent)' : 'var(--border-soft)' }} /> : null}
        </div>
      ))}
    </div>
  );
}

function Row({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: small ? '4px 0' : '6px 0', fontSize: small ? 12 : 13 }}>
      <span style={{ color: small ? 'var(--text-dim)' : 'var(--text-mute)', fontFamily: small ? 'var(--font-mono)' : 'inherit' }}>{label}</span>
      <span style={{ fontWeight: 500, fontFamily: /\d/.test(value) ? 'var(--font-mono)' : 'inherit', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function StatusNotice({ tone, children }: { tone: 'info' | 'warn' | 'error' | 'ok'; children: React.ReactNode }) {
  const colors = {
    info: { border: 'var(--info)', background: 'color-mix(in srgb, var(--info) 12%, transparent)', color: 'var(--paper)' },
    warn: { border: 'var(--warning)', background: 'color-mix(in srgb, var(--warning) 12%, transparent)', color: 'var(--paper)' },
    error: { border: 'var(--negative)', background: 'color-mix(in srgb, var(--negative) 12%, transparent)', color: 'var(--paper)' },
    ok: { border: 'var(--positive)', background: 'color-mix(in srgb, var(--positive) 12%, transparent)', color: 'var(--paper)' },
  }[tone];

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        background: colors.background,
        color: colors.color,
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

function txExplorerUrl(baseUrl: string, hash: string) {
  return `${baseUrl.replace(/\/$/, '')}/tx/${hash}`;
}

export function VaultActionModal({
  mode,
  onClose,
  onComplete,
  contracts,
  portfolio,
  profile,
  setProfile,
  profiles,
  walletAddress,
  chainId,
}: {
  mode: VaultModalMode;
  onClose: () => void;
  onComplete: () => void;
  contracts: ContractsResponse;
  portfolio: PortfolioResponse;
  profile: RiskProfileName;
  setProfile: (profile: RiskProfileName) => void;
  profiles: RiskProfiles;
  walletAddress?: Address;
  chainId?: number;
}) {
  const publicClient = usePublicClient({ chainId: expectedChainId });
  const { data: walletClient } = useWalletClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(mode === 'deposit' ? '1000' : '100');
  const [assetKey, setAssetKey] = useState(portfolio.assets[0]?.key || 'USDY');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txStatuses, setTxStatuses] = useState<TxStatus[]>([]);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [estimatingGas, setEstimatingGas] = useState(false);

  const selectedAsset = portfolio.assets.find((asset) => asset.key === assetKey) || portfolio.assets[0];
  const selectedAssetAddress = assetAddressForKey(contracts, selectedAsset?.key || assetKey);
  const vaultAddress = contracts.core.vault as Address;
  const vaultOwner = portfolio.vault.owner as Address;
  const isOwner = walletAddress?.toLowerCase() === vaultOwner.toLowerCase();
  const isWrongNetwork = Boolean(chainId && chainId !== expectedChainId);

  const parsedAmount = useMemo(() => {
    if (!selectedAsset) {
      return null;
    }

    try {
      return parseUnits(amount || '0', selectedAsset.decimals);
    } catch {
      return null;
    }
  }, [amount, selectedAsset]);

  const walletBalanceQuery = useReadContract({
    address: selectedAssetAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: Boolean(walletAddress && selectedAssetAddress),
      refetchInterval: 10_000,
    },
  });

  const allowanceQuery = useReadContract({
    address: selectedAssetAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: walletAddress ? [walletAddress, vaultAddress] : undefined,
    query: {
      enabled: mode === 'deposit' && Boolean(walletAddress && selectedAssetAddress),
      refetchInterval: 10_000,
    },
  });

  const walletBalance = walletBalanceQuery.data || 0n;
  const allowance = mode === 'deposit' ? allowanceQuery.data || 0n : 0n;
  const balanceError = walletBalanceQuery.error instanceof Error ? walletBalanceQuery.error.message : null;
  const allowanceError = allowanceQuery.error instanceof Error ? allowanceQuery.error.message : null;

  const txPlan = useMemo(() => {
    if (!parsedAmount || !selectedAssetAddress || !selectedAsset) {
      return [];
    }

    const plan: Array<{ label: string; to: Address; data: `0x${string}` }> = [];

    if (mode === 'deposit' && profileCodes[profile] !== portfolio.vault.currentRiskProfileCode) {
      plan.push({
        label: `Set risk profile → ${profile}`,
        to: vaultAddress,
        data: encodeFunctionData({
          abi: vaultAbi,
          functionName: 'setRiskProfile',
          args: [profileCodes[profile]],
        }),
      });
    }

    if (mode === 'deposit' && allowance < parsedAmount) {
      plan.push({
        label: `Approve ${selectedAsset.symbol}`,
        to: selectedAssetAddress,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [vaultAddress, parsedAmount],
        }),
      });
    }

    if (mode === 'deposit') {
      plan.push({
        label: `Deposit ${selectedAsset.symbol}`,
        to: vaultAddress,
        data: encodeFunctionData({
          abi: vaultAbi,
          functionName: 'deposit',
          args: [selectedAssetAddress, parsedAmount],
        }),
      });
    } else {
      plan.push({
        label: `Withdraw ${selectedAsset.symbol}`,
        to: vaultAddress,
        data: encodeFunctionData({
          abi: vaultAbi,
          functionName: 'withdraw',
          args: [selectedAssetAddress, parsedAmount, walletAddress || vaultOwner],
        }),
      });
    }

    return plan;
  }, [allowance, mode, parsedAmount, portfolio.vault.currentRiskProfileCode, profile, selectedAsset, selectedAssetAddress, vaultAddress, walletAddress, vaultOwner]);

  useEffect(() => {
    let cancelled = false;

    async function estimateGasPlan() {
      if (step !== 2 || txPlan.length === 0) {
        setGasEstimate(null);
        return;
      }

      setEstimatingGas(true);

      try {
        const result = await equinoxApi.estimateMantleGas({
          txs: txPlan.map((tx) => ({
            to: tx.to,
            data: tx.data,
            value: '0',
          })),
        });

        if (!cancelled) {
          setGasEstimate({
            totalGasCostEth: result.totalGasCostEth,
          });
        }
      } catch {
        if (!cancelled) {
          setGasEstimate(null);
        }
      } finally {
        if (!cancelled) {
          setEstimatingGas(false);
        }
      }
    }

    void estimateGasPlan();

    return () => {
      cancelled = true;
    };
  }, [step, txPlan]);

  const formattedWalletBalance = selectedAsset ? formatUnits(walletBalance, selectedAsset.decimals) : '0';
  const vaultExposure = selectedAsset?.totalExposureFormatted || '0';
  const amountValue = Number(amount || '0');

  async function writeAndWait(label: string, request: Parameters<NonNullable<typeof walletClient>['writeContract']>[0]) {
    if (!walletClient || !publicClient) {
      throw new Error('Wallet client is not ready.');
    }

    setTxStatuses((current) => [...current, { label, status: 'pending' }]);

    try {
      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      setTxStatuses((current) =>
        current.map((tx) =>
          tx.label === label && tx.status === 'pending'
            ? { ...tx, hash, blockNumber: receipt.blockNumber.toString(), status: 'confirmed' }
            : tx,
        ),
      );
      setTxStatuses((current) =>
        current.map((tx) =>
          tx.label === label && tx.hash === hash
            ? { ...tx, explorerUrl: txExplorerUrl(contracts.chain.explorerUrl, hash) }
            : tx,
        ),
      );
    } catch (writeError) {
      setTxStatuses((current) =>
        current.map((tx) => (tx.label === label && tx.status === 'pending' ? { ...tx, status: 'failed' } : tx)),
      );
      throw writeError;
    }
  }

  async function executeAction() {
    if (!walletClient || !publicClient || !selectedAsset || !selectedAssetAddress || !parsedAmount) {
      setError('Wallet signer or asset metadata is not ready.');
      return;
    }

    if (!walletAddress) {
      setError('Connect your owner wallet first.');
      return;
    }

    if (!isOwner) {
      setError(`Only the vault owner ${walletLabel(vaultOwner)} can ${mode} assets.`);
      return;
    }

    if (isWrongNetwork) {
      setError('Switch to Mantle Sepolia before submitting.');
      return;
    }

    if (parsedAmount <= 0n) {
      setError('Enter a valid non-zero amount.');
      return;
    }

    if (mode === 'deposit' && parsedAmount > walletBalance) {
      setError(`Wallet balance is too low for this ${selectedAsset.symbol} deposit.`);
      return;
    }

    setError(null);
    setSubmitting(true);
    setStep(3);
    setTxStatuses([]);

    try {
      if (mode === 'deposit' && profileCodes[profile] !== portfolio.vault.currentRiskProfileCode) {
        await writeAndWait(`Set risk profile → ${profile}`, {
          address: vaultAddress,
          abi: vaultAbi,
          functionName: 'setRiskProfile',
          args: [profileCodes[profile]],
          chain: publicClient.chain,
          account: walletAddress,
        });
      }

      if (mode === 'deposit' && allowance < parsedAmount) {
        await writeAndWait(`Approve ${selectedAsset.symbol}`, {
          address: selectedAssetAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [vaultAddress, parsedAmount],
          chain: publicClient.chain,
          account: walletAddress,
        });
      }

      if (mode === 'deposit') {
        await writeAndWait(`Deposit ${selectedAsset.symbol}`, {
          address: vaultAddress,
          abi: vaultAbi,
          functionName: 'deposit',
          args: [selectedAssetAddress, parsedAmount],
          chain: publicClient.chain,
          account: walletAddress,
        });
      } else {
        await writeAndWait(`Withdraw ${selectedAsset.symbol}`, {
          address: vaultAddress,
          abi: vaultAbi,
          functionName: 'withdraw',
          args: [selectedAssetAddress, parsedAmount, walletAddress],
          chain: publicClient.chain,
          account: walletAddress,
        });
      }

      onComplete();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} width={560}>
      <StepBar step={step} />

      {step === 1 ? (
        <>
          <ModalHeader
            title={mode === 'deposit' ? 'Fund the vault' : 'Withdraw from vault'}
            sub={mode === 'deposit' ? 'Approve and deposit supported assets from your owner wallet.' : 'Pull a supported asset back from the vault to your wallet.'}
            onClose={onClose}
          />
          <div style={{ padding: '0 22px 22px' }}>
            {!isOwner ? (
              <StatusNotice tone="warn">
                Connected wallet <span className="mono">{walletLabel(walletAddress)}</span> is not the vault owner. Use <span className="mono">{walletLabel(vaultOwner)}</span> to continue.
              </StatusNotice>
            ) : null}
            {isWrongNetwork ? (
              <div style={{ marginTop: 12 }}>
                <StatusNotice tone="warn">The connected wallet is not on Mantle Sepolia.</StatusNotice>
              </div>
            ) : null}
            {balanceError || allowanceError ? (
              <div style={{ marginTop: 12 }}>
                <StatusNotice tone="error">{balanceError || allowanceError}</StatusNotice>
              </div>
            ) : null}

            <div style={{ height: 18 }} />
            <label style={{ fontSize: 12, color: 'var(--text-mute)', display: 'block', marginBottom: 8 }}>Asset</label>
            <select value={assetKey} onChange={(event) => setAssetKey(event.target.value)} style={{ width: '100%', background: 'var(--surface-2)' }}>
              {portfolio.assets.map((asset) => (
                <option key={asset.key} value={asset.key}>
                  {asset.symbol} · {asset.displayName}
                </option>
              ))}
            </select>

            <div style={{ height: 18 }} />
            <label style={{ fontSize: 12, color: 'var(--text-mute)', display: 'block', marginBottom: 8 }}>
              {mode === 'deposit' ? 'Deposit amount' : 'Withdraw amount'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))}
                style={{ border: 0, padding: 0, flex: 1, fontSize: 24, fontFamily: 'var(--font-mono)', background: 'transparent' }}
              />
              <span className="mono" style={{ fontWeight: 500 }}>{selectedAsset?.symbol}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
              {mode === 'deposit'
                ? walletBalanceQuery.isLoading
                  ? `Wallet balance loading ${selectedAsset?.symbol}`
                  : `Wallet balance ${Number(formattedWalletBalance).toLocaleString(undefined, { maximumFractionDigits: selectedAsset?.symbol === 'fBTC' ? 6 : 2 })} ${selectedAsset?.symbol}`
                : `Vault exposure ${Number(vaultExposure).toLocaleString(undefined, { maximumFractionDigits: selectedAsset?.symbol === 'fBTC' ? 6 : 2 })} ${selectedAsset?.symbol}`}
            </div>

            {mode === 'deposit' ? (
              <>
                <div style={{ height: 18 }} />
                <label style={{ fontSize: 12, color: 'var(--text-mute)', display: 'block', marginBottom: 8 }}>Risk profile</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {Object.keys(profiles).map((profileKey) => (
                    <button
                      key={profileKey}
                      onClick={() => setProfile(profileKey as RiskProfileName)}
                      type="button"
                      style={{
                        border: `1px solid ${profile === profileKey ? 'var(--accent)' : 'var(--border)'}`,
                        background: profile === profileKey ? 'var(--accent-soft)' : 'var(--surface-2)',
                        padding: 14,
                        borderRadius: 'var(--r-md)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        color: 'inherit',
                        textAlign: 'left',
                        transition: 'all 160ms',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{profileKey}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.5 }}>{profiles[profileKey as RiskProfileName].blurb}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
                        <span>DD {profiles[profileKey as RiskProfileName].drawdown}</span>
                        <span style={{ color: 'var(--positive)' }}>{profiles[profileKey as RiskProfileName].minApy}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Owner {walletLabel(vaultOwner)}
            </span>
            <button
              className="btn btn-primary"
              onClick={() => setStep(2)}
              type="button"
              disabled={!parsedAmount || parsedAmount <= 0n || Boolean(balanceError || allowanceError)}
            >
              Continue <Icon name="arrow-right" size={14} />
            </button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <ModalHeader
            title="Review transactions"
            sub={mode === 'deposit' ? 'The wallet will sign every required vault transaction in order.' : 'The wallet will sign a single withdraw transaction.'}
            onClose={onClose}
          />
          <div style={{ padding: '0 22px 22px' }}>
            <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
              <Row label="Mode" value={mode === 'deposit' ? 'Deposit' : 'Withdraw'} />
              <Row label="Asset" value={selectedAsset?.symbol || '-'} />
              <Row label="Amount" value={`${amountValue.toLocaleString()} ${selectedAsset?.symbol || ''}`} />
              <Row label="Vault" value="MantleVaultOrchestrator" />
              <Row label="Owner wallet" value={walletLabel(vaultOwner)} />
              {mode === 'deposit' ? <Row label="Risk profile" value={profile} /> : null}
              <div className="divider" style={{ margin: '10px 0' }} />
              <Row label="Transaction plan" value="" />
              {txPlan.map((tx) => (
                <Row key={tx.label} label={`  ${tx.label}`} value="ready" small />
              ))}
              <div className="divider" style={{ margin: '10px 0' }} />
              <Row label="Mantle gas estimate" value={estimatingGas ? 'estimating…' : gasEstimate ? `${Number(gasEstimate.totalGasCostEth).toFixed(6)} MNT` : 'unavailable'} />
              <Row label="Network" value="Mantle Sepolia" />
            </div>
            {error ? (
              <div style={{ marginTop: 12 }}>
                <StatusNotice tone="error">{error}</StatusNotice>
              </div>
            ) : null}
          </div>
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)} type="button">← Back</button>
            <button className="btn btn-primary" onClick={executeAction} type="button" disabled={submitting}>
              {submitting ? 'Submitting...' : mode === 'deposit' ? 'Sign and deposit' : 'Sign and withdraw'}
            </button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <ModalHeader
            title={mode === 'deposit' ? 'Submitting vault transactions' : 'Submitting withdrawal'}
            sub="Waiting for wallet signatures and Mantle confirmations."
            onClose={onClose}
          />
          <div style={{ padding: '0 22px 28px' }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '16px auto 22px' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid var(--accent-soft)',
                  borderTopColor: 'var(--accent)',
                  animation: submitting ? 'spin 1.4s linear infinite' : 'none',
                }}
              />
              <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                <Icon name={error ? 'alert' : submitting ? 'wallet' : 'verified'} size={36} color={error ? 'var(--negative)' : 'var(--accent)'} />
              </div>
            </div>

            {txStatuses.length === 0 ? (
              <StatusNotice tone="info">Waiting for the first wallet signature…</StatusNotice>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-mute)', fontFamily: 'var(--font-mono)' }}>
                {txStatuses.map((tx) => (
                  <div key={`${tx.label}-${tx.hash || tx.status}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: tx.status === 'confirmed' ? 'var(--positive)' : tx.status === 'failed' ? 'var(--negative)' : 'var(--warning)' }}>
                      {tx.status === 'confirmed' ? '✓' : tx.status === 'failed' ? '×' : '•'}
                    </span>
                    <span style={{ color: tx.status === 'failed' ? 'var(--negative)' : 'var(--text)' }}>
                      {tx.label}
                      {tx.explorerUrl && tx.hash ? (
                        <>
                          {' · '}
                          <a href={tx.explorerUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                            {tx.hash.slice(0, 10)}... <Icon name="external" size={10} />
                          </a>
                        </>
                      ) : tx.hash ? ` · ${tx.hash.slice(0, 10)}...` : ''}
                      {tx.blockNumber ? ` · block ${tx.blockNumber}` : tx.status === 'pending' ? ' · pending…' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {error ? (
              <div style={{ marginTop: 16 }}>
                <StatusNotice tone="error">{error}</StatusNotice>
              </div>
            ) : null}
            {!submitting && !error ? (
              <div style={{ marginTop: 16 }}>
                <StatusNotice tone="ok">All transactions confirmed. Refreshing dashboard state…</StatusNotice>
              </div>
            ) : null}
          </div>
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" onClick={onClose} type="button">Close</button>
            {!submitting && !error ? (
              <button className="btn btn-primary" onClick={onClose} type="button">Done</button>
            ) : null}
          </div>
        </>
      ) : null}
    </Modal>
  );
}

export function FaucetModal({
  onClose,
  onComplete,
  onDeposit,
  portfolio,
  walletAddress,
}: {
  onClose: () => void;
  onComplete: () => void;
  onDeposit: () => void;
  portfolio: PortfolioResponse;
  walletAddress?: Address;
}) {
  const [assetKey, setAssetKey] = useState(portfolio.assets[0]?.key || 'USDY');
  const [amount, setAmount] = useState('1000');
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintStatus, setMintStatus] = useState<{ label: string; explorerUrl: string } | null>(null);

  const selectedAsset = portfolio.assets.find((asset) => asset.key === assetKey) || portfolio.assets[0];
  const vaultOwner = portfolio.vault.owner as Address;
  const isOwner = walletAddress?.toLowerCase() === vaultOwner.toLowerCase();
  const ownerLabel = walletLabel(vaultOwner);

  async function copyOwnerAddress() {
    try {
      await navigator.clipboard.writeText(vaultOwner);
    } catch {
      setError('Could not copy the owner address from this browser session.');
    }
  }

  async function mintSelectedAsset() {
    if (!selectedAsset || !walletAddress) {
      setError('Connect your owner wallet before minting test assets.');
      return;
    }

    if (!isOwner) {
      setError(`Only the vault owner ${walletLabel(vaultOwner)} should receive demo assets for this vault.`);
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid non-zero amount.');
      return;
    }

    setError(null);
    setMintStatus(null);
    setMinting(true);

    try {
      const result = await equinoxApi.mintDemoAsset({
        asset: selectedAsset.key,
        recipient: walletAddress,
        amount,
      });

      setMintStatus({
        label: `Minted ${Number(result.amountFormatted).toLocaleString(undefined, { maximumFractionDigits: selectedAsset.symbol === 'fBTC' ? 6 : 2 })} ${selectedAsset.symbol}`,
        explorerUrl: result.receipt.explorerUrl,
      });
      onComplete();
    } catch (mintError) {
      setError(mintError instanceof Error ? mintError.message : 'Demo mint failed.');
    } finally {
      setMinting(false);
    }
  }

  return (
    <Modal onClose={onClose} width={480}>
      <ModalHeader
        title="Faucet"
        sub="Mint supported demo assets to the vault owner wallet for Mantle Sepolia testing."
        onClose={onClose}
      />
      <div style={{ padding: '0 22px 22px' }}>
        {!isOwner ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StatusNotice tone="warn">
              Switch to the vault owner wallet before using the faucet. The vault only accepts deposits from its owner.
            </StatusNotice>
            <div style={{ padding: 14, border: '1px solid var(--border-soft)', borderRadius: 10, background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Required wallet
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span className="mono" style={{ fontSize: 13 }}>{ownerLabel}</span>
                <button className="btn btn-sm btn-outline" onClick={() => void copyOwnerAddress()} type="button">
                  <Icon name="copy" size={12} /> Copy
                </button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.6 }}>
              Connected wallet: <span className="mono">{walletLabel(walletAddress)}</span>
            </div>
          </div>
        ) : (
          <>
            <StatusNotice tone="ok">
              Owner wallet connected. Mint demo assets here, then deposit them into the vault.
            </StatusNotice>

            <div style={{ height: 18 }} />
            <label style={{ fontSize: 12, color: 'var(--text-mute)', display: 'block', marginBottom: 8 }}>Asset</label>
            <select value={assetKey} onChange={(event) => setAssetKey(event.target.value)} style={{ width: '100%', background: 'var(--surface-2)' }}>
              {portfolio.assets.map((asset) => (
                <option key={asset.key} value={asset.key}>
                  {asset.symbol} · {asset.displayName}
                </option>
              ))}
            </select>

            <div style={{ height: 18 }} />
            <label style={{ fontSize: 12, color: 'var(--text-mute)', display: 'block', marginBottom: 8 }}>Amount</label>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))}
                style={{ border: 0, padding: 0, flex: 1, fontSize: 24, fontFamily: 'var(--font-mono)', background: 'transparent' }}
              />
              <span className="mono" style={{ fontWeight: 500 }}>{selectedAsset?.symbol}</span>
            </div>
          </>
        )}

        {error ? (
          <div style={{ marginTop: 12 }}>
            <StatusNotice tone="error">{error}</StatusNotice>
          </div>
        ) : null}
        {mintStatus ? (
          <div style={{ marginTop: 12 }}>
            <StatusNotice tone="ok">
              {mintStatus.label}{' '}
              <a href={mintStatus.explorerUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                View tx
              </a>
            </StatusNotice>
          </div>
        ) : null}
      </div>
      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Recipient {ownerLabel}</span>
        {mintStatus ? (
          <button className="btn btn-primary" onClick={onDeposit} type="button">
            <Icon name="arrow-right" size={13} /> Deposit
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => void mintSelectedAsset()}
            type="button"
            disabled={minting || !isOwner || !amount || Number(amount) <= 0}
          >
            <Icon name="plus" size={13} /> {minting ? 'Minting…' : 'Mint'}
          </button>
        )}
      </div>
    </Modal>
  );
}

export function RiskShieldModal({ onClose, attempted, profile, profiles }: {
  onClose: () => void;
  attempted: { asset: string; weight: number };
  profile: string;
  profiles: RiskProfiles;
}) {
  const cap = profiles[profile as keyof RiskProfiles]?.max[attempted.asset] ?? 0;

  return (
    <Modal onClose={onClose} width={520}>
      <div
        style={{
          padding: '26px 22px 18px',
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--negative) 14%, transparent), transparent)',
          borderBottom: '1px solid var(--border-soft)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            margin: '0 auto 14px',
            background: 'var(--negative-soft)',
            color: 'var(--negative)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="shield" size={28} />
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Transaction rejected by the vault</h3>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-mute)' }}>
          The proposed allocation breached the selected risk profile and no funds moved.
        </p>
      </div>
      <div style={{ padding: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          <CodeRow k="profile" v={profile} />
          <CodeRow k="proposed" v={`${attempted.asset} ${(attempted.weight * 100).toFixed(1)}%`} bad />
          <CodeRow k="profile.max" v={`${attempted.asset} ${(cap * 100).toFixed(0)}%`} />
          <CodeRow k="error" v={`RiskProfileGuard: cap exceeded by ${((attempted.weight - cap) * 100).toFixed(1)}%`} bad />
          <CodeRow k="action" v="execution rejected · funds untouched" ok />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.6, marginTop: 14 }}>
          The rejected decision can still be logged on-chain through the backend so the agent history remains auditable.
        </p>
      </div>
      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={onClose} type="button">Acknowledged</button>
      </div>
    </Modal>
  );
}

function CodeRow({ k, v, ok, bad }: { k: string; v: string; ok?: boolean; bad?: boolean }) {
  return (
    <div style={{ display: 'flex', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
      <span style={{ color: 'var(--text-dim)', width: 110 }}>{k}</span>
      <span style={{ color: bad ? 'var(--negative)' : ok ? 'var(--positive)' : 'var(--text)' }}>{v}</span>
    </div>
  );
}
