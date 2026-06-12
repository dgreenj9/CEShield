// Root layout for the Next.js App Router.
// Anything here is shared across every page: <html>, <body>, fonts,
// global CSS, default metadata.

import React from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import '../index.css';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  metadataBase: new URL('https://ceshield.com'),
  title: {
    default: 'CE Shield — Rehab career intelligence + CE compliance',
    template: '%s · CE Shield',
  },
  description:
    `${siteStats.certCount} rehab credentials scored across five career-path lenses — clinical, business, academic clinical, research, and healthtech — with ${siteStats.citationTotal.toLocaleString()} curated citations. Built for physical and occupational therapists.`,
  keywords: [
    'rehabilitation certifications',
    'evidence-based',
    'physical therapy',
    'occupational therapy',
    'PT', 'OT',
    'CE tracking',
    'license renewal',
    'compliance',
    'career intelligence',
  ],
  authors: [{ name: 'CE Shield' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: 'CE Shield — Rehab career intelligence + CE compliance',
    description:
      `${siteStats.certCount} rehab credentials scored across five career-path lenses, six adjustable dimensions per lens, with ${siteStats.citationTotal.toLocaleString()} curated citations.`,
    url: '/',
    siteName: 'CE Shield',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CE Shield',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CE Shield — Rehab career intelligence + CE compliance',
    description:
      `${siteStats.certCount} rehab credentials, ${siteStats.citationTotal.toLocaleString()} curated citations, five career-path lenses. Built by PTs for PTs and OTs.`,
    images: ['/og-image.png'],
  },
  // Favicon + icon files are auto-detected by Next from the app/ directory
  // (app/favicon.ico, app/icon.svg). No metadata.icons override needed.
};

// Next 14+ split themeColor out of the metadata export.
export const viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts — preconnect + the same Google Fonts URL CRA's index.html
            uses. Next normally manages fonts via next/font for self-hosting,
            but for parity with the existing CRA build during the migration
            we use the same external link. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@200;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
      {/* GA4 — activates only when NEXT_PUBLIC_GA_ID is set (Vercel env).
          Loaded after the body via Next's third-parties helper so it never
          blocks rendering. trim() guards against stray whitespace/newlines
          from CLI-entered env values corrupting the loader URL. */}
      {process.env.NEXT_PUBLIC_GA_ID?.trim() && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID.trim()} />
      )}
    </html>
  );
}
