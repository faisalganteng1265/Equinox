'use client';

import { Icon } from './icons';
import { SigilMark } from './v2-hero';
import type { Agent, Venue, RiskProfiles, FeedEntry } from '@/lib/data';

const NFTBadge = SigilMark;

export function AgentsPage({ agents, onSelect, selected }: {
  agents: Agent[];
  onSelect: (a: Agent) => void;
  selected: Agent | null;
}) {
  const sel = selected || agents.find(a => a.isYou) || agents[0];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18, alignItems: 'flex-start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h2 className="display" style={{ fontSize: 36, fontStyle: 'italic', margin: 0, fontWeight: 400 }}>Agent Registry</h2>
            <p style={{ fontSize: 13, color: 'var(--text-mute)', margin: '6px 0 0' }}>
              All agents are minted as ERC-8004 identity NFTs on Mantle. Reputation, decisions, and yield history are recorded on-chain.
            </p>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1.8fr 1fr 1fr 1fr 1fr 1.1fr', padding: '12px 18px', color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <div>#</div>
            <div>Agent</div>
            <div>Score</div>
            <div>APY 30d</div>
            <div>Sharpe</div>
            <div>Max DD</div>
            <div style={{ textAlign: 'right' }}>AUM</div>
          </div>
          <div className="divider" />
          {agents.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--text-mute)', fontSize: 13, lineHeight: 1.6 }}>
              No live agent registry rows are available yet. Refresh backend state after the agent contract is configured.
            </div>
          ) : null}
          {agents.map((a, i) => (
            <div key={a.id}
              onClick={() => onSelect(a)}
              style={{
                display: 'grid', gridTemplateColumns: '60px 1.8fr 1fr 1fr 1fr 1fr 1.1fr',
                alignItems: 'center', padding: '16px 18px',
                borderBottom: i === agents.length - 1 ? 'none' : '1px solid var(--border-soft)',
                cursor: 'pointer',
                background: sel?.id === a.id ? 'var(--surface-2)' : 'transparent',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => { if (sel?.id !== a.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--hover)'; }}
              onMouseLeave={e => { if (sel?.id !== a.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <div className="num dim" style={{ fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <NFTBadge agent={a} size={36} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {a.name}
                    {a.isYou && (
                      <span className="chip" style={{ padding: '1px 6px', fontSize: 9, color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)', background: 'var(--accent-soft)' }}>YOU</span>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>#{a.id} · {a.profile}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 4, width: 50, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{ width: `${a.score}%`, height: '100%', background: 'var(--accent)' }} />
                </div>
                <span className="num" style={{ fontSize: 13, fontWeight: 500 }}>{a.score}</span>
              </div>
              <div className="num pos" style={{ fontSize: 13 }}>+{a.apy30.toFixed(2)}%</div>
              <div className="num" style={{ fontSize: 13 }}>{a.sharpe.toFixed(2)}</div>
              <div className="num" style={{ fontSize: 13, color: a.maxDD > 4 ? 'var(--warning)' : 'var(--text)' }}>{a.maxDD.toFixed(1)}%</div>
              <div className="num" style={{ fontSize: 13, textAlign: 'right' }}>${(a.portfolio / 1000).toFixed(0)}k</div>
            </div>
          ))}
        </div>
      </div>

      <AgentDetailCard agent={sel} />
    </div>
  );
}

export function AgentDetailCard({ agent }: { agent: Agent | null }) {
  if (!agent) return null;
  const totalOutcomes = agent.wins + agent.losses;
  const winRate = totalOutcomes > 0 ? Math.round((agent.wins / totalOutcomes) * 100) : 0;

  return (
    <div className="card" style={{ overflow: 'hidden', position: 'sticky', top: 80 }}>
      <div style={{
        padding: 22,
        background: `linear-gradient(160deg, color-mix(in oklch, var(--accent), transparent 70%) 0%, var(--surface) 70%)`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 85% 0%, color-mix(in oklch, var(--accent), transparent 55%), transparent 50%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <NFTBadge agent={agent} size={88} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{agent.name}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>ERC-8004 · #{agent.id}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span className="chip" style={{ color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)', background: 'var(--accent-soft)' }}>
                <Icon name="verified" size={10} /> {agent.badge}
              </span>
              <span className="chip" style={{ color: 'var(--text-mute)' }}>{agent.profile}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Performance record</div>
        <div style={{ padding: 16, border: '1px solid var(--border-soft)', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--text-mute)', fontSize: 12, lineHeight: 1.6 }}>
          Performance is read from the on-chain agent registry. The current contract records cumulative performance bps and decision outcomes.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16 }}>
          <Mini label="Score" value={String(agent.score)} sub="/100" accent />
          <Mini label="APY 30d" value={`+${agent.apy30.toFixed(2)}%`} positive />
          <Mini label="APY 90d" value={`+${agent.apy90.toFixed(2)}%`} />
          <Mini label="Sharpe" value={agent.sharpe.toFixed(2)} />
          <Mini label="Max DD" value={`${agent.maxDD.toFixed(1)}%`} />
          <Mini label="Win rate" value={`${winRate}%`} />
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 10px' }}>On-chain record</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
          <Kv k="Inception" v={agent.inception} />
          <Kv k="Decisions logged" v={agent.decisions.toLocaleString()} />
          <Kv k="Assets under mgmt" v={`$${agent.portfolio.toLocaleString()}`} />
          <Kv k="Strategy" v={agent.profile} />
          <Kv k="Contract" v="MantleAgentRegistry8004" mono />
        </div>

        <button className="btn btn-outline" style={{ width: '100%', marginTop: 18 }}>
          <Icon name="external" size={13} /> View on Mantle Explorer
        </button>
      </div>
    </div>
  );
}

function Mini({ label, value, sub, positive, accent }: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  accent?: boolean;
}) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10 }}>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div className="num" style={{ fontSize: 16, marginTop: 4, fontWeight: 500, color: accent ? 'var(--accent)' : positive ? 'var(--positive)' : 'var(--text)' }}>
        {value}<span className="dim" style={{ fontSize: 11, fontWeight: 400 }}>{sub}</span>
      </div>
    </div>
  );
}

function Kv({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-mute)' }}>{k}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function StrategyPage({ venues, profile, profiles }: {
  venues: Venue[];
  profile: string;
  profiles: RiskProfiles;
}) {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 className="display" style={{ fontSize: 36, fontStyle: 'italic', margin: 0, fontWeight: 400 }}>Strategy</h2>
        <p style={{ fontSize: 13, color: 'var(--text-mute)', margin: '6px 0 0' }}>
          Venues your agent can route to. Caps follow the {profile} risk profile.
        </p>
      </div>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 1fr 1fr 1fr 110px', padding: '12px 18px', color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <div>Venue</div>
          <div>Type</div>
          <div>Asset</div>
          <div>APY</div>
          <div>TVL</div>
          <div style={{ textAlign: 'right' }}>State</div>
        </div>
        <div className="divider" />
        {venues.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-mute)', fontSize: 13, lineHeight: 1.6 }}>
            No strategy adapters were returned by the backend. Check contract addresses and strategy registry configuration.
          </div>
        ) : null}
        {venues.map((v, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 1fr 1fr 1fr 110px',
            alignItems: 'center', padding: '14px 18px',
            borderBottom: i === venues.length - 1 ? 'none' : '1px solid var(--border-soft)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{v.name}<span className="dim" style={{ marginLeft: 8, fontSize: 11 }}>{v.chain}</span></div>
            <div>
              <span className="chip" style={{
                color: v.kind === 'CeFi' ? 'var(--info)' : v.kind === 'RWA' ? 'var(--warning)' : 'var(--accent)',
                borderColor: v.kind === 'CeFi' ? 'color-mix(in srgb, var(--info) 30%, transparent)' : v.kind === 'RWA' ? 'color-mix(in srgb, var(--warning) 30%, transparent)' : 'color-mix(in srgb, var(--accent) 30%, transparent)',
              }}>{v.kind}</span>
            </div>
            <div className="mono" style={{ fontSize: 12 }}>{v.asset}</div>
            <div className="num pos" style={{ fontSize: 13 }}>{v.apy.toFixed(2)}%</div>
            <div className="num" style={{ fontSize: 13, color: 'var(--text-mute)' }}>{v.tvl}</div>
            <div style={{ textAlign: 'right' }}>
              {v.state === 'active' ? (
                <span className="chip" style={{ color: 'var(--positive)', borderColor: 'color-mix(in srgb, var(--positive) 30%, transparent)' }}>
                  <span className="chip-dot" /> Active
                </span>
              ) : (
                <span className="chip" style={{ color: 'var(--text-mute)' }}>Available</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* suppress unused profile */}
      <div style={{ display: 'none' }}>{profiles[profile as keyof RiskProfiles]?.label}</div>
    </div>
  );
}

export function HistoryPage({ entries }: { entries: FeedEntry[] }) {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 className="display" style={{ fontSize: 36, fontStyle: 'italic', margin: 0, fontWeight: 400 }}>Decision History</h2>
        <p style={{ fontSize: 13, color: 'var(--text-mute)', margin: '6px 0 0' }}>
          Every agent decision is logged via ERC-8004 with a hash of its reasoning. Audit any tx on Mantle Explorer.
        </p>
      </div>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 2fr 1fr 1fr 1fr', padding: '12px 18px', color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <div>Time</div>
          <div>Action</div>
          <div>Reasoning</div>
          <div>Venue</div>
          <div>Delta</div>
          <div>Tx</div>
        </div>
        <div className="divider" />
        {entries.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-mute)', fontSize: 13, lineHeight: 1.6 }}>
            No agent decisions have been recorded yet. Run a preview, execute a plan, or record a blocked decision from the portfolio page.
          </div>
        ) : null}
        {entries.map((e, i) => {
          const color = e.kind === 'guard' ? 'var(--negative)' : e.kind === 'bridge' ? 'var(--info)' : 'var(--accent)';
          return (
            <div key={e._key || i} style={{
              display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 2fr 1fr 1fr 1fr',
              alignItems: 'center', padding: '14px 18px',
              borderBottom: i === entries.length - 1 ? 'none' : '1px solid var(--border-soft)',
              fontSize: 12,
            }}>
              <div className="mono dim">{e.timestamp || e.ago}</div>
              <div>
                <span className="chip" style={{ color, borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}>
                  {e.kind === 'guard' ? 'Blocked' : e.kind === 'bridge' ? 'Bridge' : e.kind === 'rebalance' ? 'Rebalance' : 'Scan'}
                </span>
                <div style={{ marginTop: 4, fontWeight: 500, color: 'var(--text)' }}>{e.title}</div>
              </div>
              <div style={{ color: 'var(--text-mute)', lineHeight: 1.5, paddingRight: 12 }}>{e.body}</div>
              <div style={{ color: 'var(--text-mute)' }}>{e.venue}</div>
              <div className="mono" style={{ color: e.kind === 'guard' ? 'var(--negative)' : 'var(--text)' }}>{e.delta}</div>
              <div className="mono dim">
                {e.txUrl && e.tx ? (
                  <a href={e.txUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {e.tx.slice(0, 10)}... <Icon name="external" size={10} />
                  </a>
                ) : e.tx ? e.tx.slice(0, 10) : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
