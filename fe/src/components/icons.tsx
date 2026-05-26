'use client';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.6, className }: IconProps) {
  const s = size;
  const sw = strokeWidth;
  const stroke = { fill: 'none' as const, stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const fill = { fill: color, stroke: 'none' as const };

  switch (name) {
    case 'logo':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.6" />
          <path d="M3.4 12.6 Q12 6 20.6 12.6" fill="none" stroke={color} strokeWidth="1.6" />
          <path d="M3.4 11.4 Q12 18 20.6 11.4" fill="none" stroke={color} strokeWidth="1.6" />
          <circle cx="12" cy="12" r="1.8" fill={color} />
        </svg>
      );
    case 'portfolio':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M4 6h16v12H4z M4 10h16" {...stroke} /><circle cx="9" cy="14" r="1.2" {...fill} /></svg>);
    case 'agent':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><rect x="5" y="6" width="14" height="12" rx="3" {...stroke} /><circle cx="9.5" cy="12" r="1.2" {...fill} /><circle cx="14.5" cy="12" r="1.2" {...fill} /><path d="M12 2v4" {...stroke} /></svg>);
    case 'shield':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" {...stroke} /></svg>);
    case 'bridge':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M3 12h18 M7 12V8 M11 12V7 M13 12V7 M17 12V8 M3 12c4 5 14 5 18 0" {...stroke} /></svg>);
    case 'strategy':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M4 18l5-7 4 4 7-9" {...stroke} /></svg>);
    case 'history':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="8" {...stroke} /><path d="M12 7v5l3 2" {...stroke} /></svg>);
    case 'settings':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="3" {...stroke} /><path d="M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6l1.4 1.4 M17 17l1.4 1.4 M5.6 18.4 7 17 M17 7l1.4-1.4" {...stroke} /></svg>);
    case 'wallet':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><rect x="3" y="6" width="18" height="13" rx="2" {...stroke} /><path d="M3 10h18" {...stroke} /><circle cx="17" cy="14.5" r="1.2" {...fill} /></svg>);
    case 'plus': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M12 5v14 M5 12h14" {...stroke} /></svg>);
    case 'minus': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M5 12h14" {...stroke} /></svg>);
    case 'arrow-up': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M12 19V5 M6 11l6-6 6 6" {...stroke} /></svg>);
    case 'arrow-down': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M12 5v14 M6 13l6 6 6-6" {...stroke} /></svg>);
    case 'arrow-up-right': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M7 17L17 7 M9 7h8v8" {...stroke} /></svg>);
    case 'arrow-right': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M5 12h14 M13 6l6 6-6 6" {...stroke} /></svg>);
    case 'check': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M5 12l4.5 4.5L19 7" {...stroke} /></svg>);
    case 'close': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M6 6l12 12 M18 6L6 18" {...stroke} /></svg>);
    case 'info': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="9" {...stroke} /><path d="M12 11v6 M12 7.5v.5" {...stroke} /></svg>);
    case 'alert': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M12 3l10 18H2z" {...stroke} /><path d="M12 10v5 M12 17.5v.5" {...stroke} /></svg>);
    case 'spark': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6z" {...stroke} /></svg>);
    case 'search': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><circle cx="11" cy="11" r="6.5" {...stroke} /><path d="M16 16l4 4" {...stroke} /></svg>);
    case 'bell': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5z M10 20a2 2 0 004 0" {...stroke} /></svg>);
    case 'chevron-down': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M6 10l6 6 6-6" {...stroke} /></svg>);
    case 'chevron-right': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M10 6l6 6-6 6" {...stroke} /></svg>);
    case 'external': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M14 4h6v6 M20 4L10 14 M5 7v12h12" {...stroke} /></svg>);
    case 'copy': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><rect x="8" y="8" width="12" height="12" rx="2" {...stroke} /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" {...stroke} /></svg>);
    case 'swap': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M7 7h12 M16 4l3 3-3 3 M17 17H5 M8 14l-3 3 3 3" {...stroke} /></svg>);
    case 'lock': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><rect x="5" y="11" width="14" height="9" rx="2" {...stroke} /><path d="M8 11V8a4 4 0 018 0v3" {...stroke} /></svg>);
    case 'play': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M7 5l12 7-12 7z" {...stroke} /></svg>);
    case 'pause': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M8 5v14 M16 5v14" {...stroke} /></svg>);
    case 'zap': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M13 3L4 14h7l-1 7 9-11h-7z" {...stroke} /></svg>);
    case 'verified':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><path d="M12 3l2.6 1.8 3.1-.3 1.4 2.8 2.4 2.1-.8 3 .8 3-2.4 2.1-1.4 2.8-3.1-.3L12 21l-2.6-1.8-3.1.3-1.4-2.8-2.4-2.1.8-3-.8-3 2.4-2.1 1.4-2.8 3.1.3z" {...stroke} /><path d="M8.5 12.2l2.5 2.5 4.5-5" {...stroke} /></svg>);
    case 'dot': return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="3" {...fill} /></svg>);
    case 'drag':
      return (<svg width={s} height={s} viewBox="0 0 24 24" className={className}><circle cx="9" cy="6" r="1.3" {...fill} /><circle cx="9" cy="12" r="1.3" {...fill} /><circle cx="9" cy="18" r="1.3" {...fill} /><circle cx="15" cy="6" r="1.3" {...fill} /><circle cx="15" cy="12" r="1.3" {...fill} /><circle cx="15" cy="18" r="1.3" {...fill} /></svg>);
    default: return null;
  }
}
