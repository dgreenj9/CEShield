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
    default: 'CE Shield · Credential scores and CE compliance',
    template: '%s · CE Shield',
  },
  description:
    `${siteStats.certCount} rehab credentials scored across five career lenses with ${siteStats.citationTotal.toLocaleString()} curated citations. CE compliance tracking for physical and occupational therapists.`,
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
    title: 'CE Shield · Credential scores and CE compliance',
    description:
      `${siteStats.certCount} rehab credentials, five career lenses, six adjustable dimensions per lens, ${siteStats.citationTotal.toLocaleString()} curated citations.`,
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
    title: 'CE Shield · Credential scores and CE compliance',
    description:
      `${siteStats.certCount} rehab credentials, ${siteStats.citationTotal.toLocaleString()} curated citations, five career lenses. Built by practicing PTs.`,
    images: ['/og-image.png'],
  },
  // Favicon + icon files are auto-detected by Next from the app/ directory
  // (app/favicon.ico, app/icon.svg). No metadata.icons override needed.
};

// Next 14+ split themeColor out of the metadata export.
export const viewport = {
  themeColor: '#292331',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* One typeface: Figtree, variable weight, light at display sizes. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* The stage: one warm light on a plum ground, with a little grain. */}
        <div className="world" aria-hidden="true"><i /><i /></div>
        {children}
      </body>
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
