'use client';

import { useState, useEffect } from 'react';
import { Icon } from './icons';
import type { RiskProfiles } from '@/lib/data';

interface WalletInfo {
  address: string;
  short: string;
  balance: string;
  wallet: string;
}

function Modal({ onClose, children, width = 480 }: {
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
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
        {sub && <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-mute)' }}>{sub}</p>}
      </div>
      <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="close" size={16} /></button>
    </div>
  );
}

export function WalletConnectModal({ onClose, onConnect }: {
  onClose: () => void;
  onConnect: (w: WalletInfo) => void;
}) {
  const wallets = [
    { id: 'metamask', name: 'MetaMask', sub: 'Most popular', color: '#F6851B' },
    { id: 'walletconnect', name: 'WalletConnect', sub: 'Scan with mobile wallet', color: '#3B99FC' },
    { id: 'rabby', name: 'Rabby', sub: 'Security-first', color: '#7084FF' },
    { id: 'safe', name: 'Safe', sub: 'Multisig', color: '#12FF80' },
  ];
  const [connecting, setConnecting] = useState<string | null>(null);

  const connect = (w: typeof wallets[0]) => {
    setConnecting(w.id);
    setTimeout(() => {
      onConnect({ address: '0xC4f8…21aE', short: '0xC4f8…21aE', balance: '12.428', wallet: w.name });
    }, 900);
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Connect a wallet" sub="Mantle testnet · auto-switched after connect" onClose={onClose} />
      <div style={{ padding: '0 22px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {wallets.map(w => (
          <button key={w.id} onClick={() => connect(w)} disabled={!!(connecting && connecting !== w.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 14px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--r-md)',
              cursor: 'pointer',
              fontFamily: 'inherit', color: 'inherit', textAlign: 'left',
              transition: 'border-color 120ms, background 120ms',
              opacity: connecting && connecting !== w.id ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!connecting) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-soft)'}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: w.color, opacity: 0.85 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>{w.sub}</div>
            </div>
            {connecting === w.id ? (
              <div style={{ fontSize: 12, color: 'var(--accent)' }}>Connecting…</div>
            ) : (
              <Icon name="arrow-right" size={14} color="var(--text-dim)" />
            )}
          </button>
        ))}
        <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 10, padding: '0 12px', lineHeight: 1.6 }}>
          By connecting, you agree to Equinox&apos;s Terms of Use. Your AI agent will be minted as an ERC-8004 identity NFT to your wallet.
        </div>
      </div>
    </Modal>
  );
}

export function DepositModal({ onClose, onDeposit, profile, setProfile, profiles }: {
  onClose: () => void;
  onDeposit: (info: { amount: number; asset: string; profile: string }) => void;
  profile: string;
  setProfile: (p: string) => void;
  profiles: RiskProfiles;
}) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('10000');
  const [asset, setAsset] = useState('USDY');
  const value = parseFloat(amount) || 0;

  const next = () => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      setStep(3);
      setTimeout(() => { onDeposit({ amount: value, asset, profile }); }, 1800);
    }
  };

  return (
    <Modal onClose={onClose} width={560}>
      <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: n === 3 ? 0 : 1 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: step >= n ? 'var(--accent)' : 'var(--surface-3)',
              color: step >= n ? 'var(--accent-fg)' : 'var(--text-mute)',
              display: 'grid', placeItems: 'center',
              fontSize: 11, fontWeight: 600,
            }}>{step > n ? '✓' : n}</div>
            <span style={{ fontSize: 12, color: step >= n ? 'var(--text)' : 'var(--text-dim)' }}>
              {n === 1 ? 'Configure' : n === 2 ? 'Review' : 'Mint'}
            </span>
            {n !== 3 && <div style={{ flex: 1, height: 1, background: step > n ? 'var(--accent)' : 'var(--border-soft)' }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <ModalHeader title="Open a position" sub="Choose your starting capital and risk profile" onClose={onClose} />
          <div style={{ padding: '0 22px 22px' }}>
            <label style={{ fontSize: 12, color: 'var(--text-mute)', display: 'block', marginBottom: 8 }}>Deposit amount</label>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
              <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                style={{ border: 0, padding: 0, flex: 1, fontSize: 24, fontFamily: 'var(--font-mono)', background: 'transparent' }} />
              <select value={asset} onChange={e => setAsset(e.target.value)} style={{ border: 0, fontWeight: 500, background: 'transparent', paddingRight: 24, color: 'inherit' }}>
                <option>USDY</option>
                <option>USDC</option>
                <option>mETH</option>
              </select>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>≈ ${value.toLocaleString()} · Balance 84,210.55 {asset}</div>

            <div style={{ height: 18 }} />
            <label style={{ fontSize: 12, color: 'var(--text-mute)', display: 'block', marginBottom: 8 }}>Risk profile</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {Object.keys(profiles).map(p => (
                <button key={p} onClick={() => setProfile(p)}
                  style={{
                    border: `1px solid ${profile === p ? 'var(--accent)' : 'var(--border)'}`,
                    background: profile === p ? 'var(--accent-soft)' : 'var(--surface-2)',
                    padding: 14, borderRadius: 'var(--r-md)',
                    cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left',
                    transition: 'all 160ms',
                  }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{p}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.5 }}>{profiles[p as keyof RiskProfiles].blurb}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
                    <span>DD {profiles[p as keyof RiskProfiles].drawdown}</span>
                    <span style={{ color: 'var(--positive)' }}>{profiles[p as keyof RiskProfiles].minApy}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Gas est. ~$0.04 on Mantle</span>
            <button className="btn btn-primary" onClick={next}>Continue <Icon name="arrow-right" size={14} /></button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <ModalHeader title="Review & sign" sub="Two transactions: approve, then mint your agent" onClose={onClose} />
          <div style={{ padding: '0 22px 22px' }}>
            <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
              <Row label="Deposit" value={`${value.toLocaleString()} ${asset}`} />
              <Row label="Risk Profile" value={profile} />
              <Row label="Vault" value="MantleVaultOrchestrator.sol" />
              <Row label="Agent NFT" value="ERC-8004 · auto-mint on deposit" />
              <div className="divider" style={{ margin: '10px 0' }} />
              <Row label="Initial allocation" value="" />
              {Object.entries(profiles[profile as keyof RiskProfiles].target).map(([k, v]) => (
                <Row key={k} label={`  ${k}`} value={`${(v * 100).toFixed(0)}%`} small />
              ))}
              <div className="divider" style={{ margin: '10px 0' }} />
              <Row label="Gas (estimate)" value="$0.04" />
              <Row label="Network" value="Mantle Testnet" />
            </div>
          </div>
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={next}>Sign 2 transactions</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <ModalHeader title="Minting your agent" sub="Recording identity on Mantle…" onClose={onClose} />
          <div style={{ padding: '0 22px 32px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '16px auto 22px' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '2px solid var(--accent-soft)',
                borderTopColor: 'var(--accent)',
                animation: 'spin 1.4s linear infinite',
              }} />
              <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                <Icon name="verified" size={36} color="var(--accent)" />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', textAlign: 'left', maxWidth: 380, margin: '0 auto' }}>
              <TxLine ok>approve(USDY, vault, ∞) confirmed · block 2841108</TxLine>
              <TxLine ok>vault.deposit(...) confirmed · block 2841109</TxLine>
              <TxLine>agentRegistry.mint(profile=Balanced) pending…</TxLine>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

function Row({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: small ? '4px 0' : '6px 0', fontSize: small ? 12 : 13 }}>
      <span style={{ color: small ? 'var(--text-dim)' : 'var(--text-mute)', fontFamily: small ? 'var(--font-mono)' : 'inherit' }}>{label}</span>
      <span style={{ fontWeight: 500, fontFamily: typeof value === 'string' && /\d/.test(value) ? 'var(--font-mono)' : 'inherit' }}>{value}</span>
    </div>
  );
}

function TxLine({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: ok ? 'var(--positive)' : 'var(--warning)' }}>{ok ? '✓' : '•'}</span>
      <span style={{ color: ok ? 'var(--text-mute)' : 'var(--text)' }}>{children}</span>
    </div>
  );
}

export function RiskShieldModal({ onClose, attempted, profile, profiles }: {
  onClose: () => void;
  attempted: { asset: string; weight: number };
  profile: string;
  profiles: RiskProfiles;
}) {
  const cap = profiles[profile as keyof RiskProfiles].max[attempted.asset];
  return (
    <Modal onClose={onClose} width={520}>
      <div style={{
        padding: '26px 22px 18px',
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--negative) 14%, transparent), transparent)',
        borderBottom: '1px solid var(--border-soft)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
          background: 'var(--negative-soft)', color: 'var(--negative)',
          display: 'grid', placeItems: 'center',
        }}>
          <Icon name="shield" size={28} />
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Transaction reverted on-chain</h3>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-mute)' }}>
          The vault detected a risk-profile violation and refused to execute.
        </p>
      </div>
      <div style={{ padding: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          <CodeRow k="agent" v="#9134 Equinox Prime" />
          <CodeRow k="proposed" v={`${attempted.asset} ${(attempted.weight * 100).toFixed(1)}%`} bad />
          <CodeRow k="profile.max" v={`${attempted.asset} ${(cap * 100).toFixed(0)}%`} />
          <CodeRow k="error" v={`RiskProfileGuard: cap exceeded by ${((attempted.weight - cap) * 100).toFixed(1)}%`} bad />
          <CodeRow k="action" v="execution reverted · funds untouched" ok />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-mute)', lineHeight: 1.6, marginTop: 14 }}>
          The agent&apos;s reasoning has been logged via ERC-8004 for review. No funds left the vault.
          You can raise your risk profile to allow this allocation, or keep the existing guardrails.
        </p>
      </div>
      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-ghost"><Icon name="external" size={13} /> View on Explorer</button>
        <button className="btn btn-primary" onClick={onClose}>Acknowledged</button>
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
