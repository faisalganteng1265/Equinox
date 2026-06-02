import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Equinox RWA | Capital Topology',
  description: 'AI-native RWA portfolio management on Mantle. ERC-8004 agent identity.',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/logo.png', rel: 'shortcut icon', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'Equinox RWA | Capital Topology',
    description:
      'AI-native RWA portfolio management on Mantle with ERC-8004 agent identity and risk-guarded execution.',
    type: 'website',
    siteName: 'Equinox RWA',
    images: [
      {
        url: '/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'Equinox RWA Open Graph Banner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Equinox RWA | Capital Topology',
    description:
      'AI-native RWA portfolio management on Mantle with ERC-8004 agent identity and risk-guarded execution.',
    images: ['/og-banner.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
