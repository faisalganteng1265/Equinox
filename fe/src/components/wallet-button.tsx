'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

import { Icon } from './icons';

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        mounted,
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        if (!connected) {
          return (
            <button className="btn btn-primary" onClick={openConnectModal} type="button">
              <Icon name="wallet" size={13} /> Connect
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button className="btn btn-outline" onClick={openChainModal} type="button">
              <Icon name="alert" size={13} color="var(--warning)" /> Wrong network
            </button>
          );
        }

        return (
          <button className="btn btn-outline" onClick={openAccountModal} type="button">
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), oklch(0.7 0.16 280))',
              }}
            />
            <span className="mono">{account.displayName}</span>
            {account.displayBalance ? <span className="eyebrow">{account.displayBalance}</span> : null}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
