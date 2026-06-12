// Landing page. Next App Router entry point at "/".
// Imports the existing LandingPage view component, which is marked
// 'use client' via the wrapper below since it uses scroll listeners +
// count-up animations. Static HTML is still SSG'd by Next; only the
// hydration JS ships to the client.

import LandingPageClient from './_landing-client';
import siteStats from '@/data/siteStats.json';

export const metadata = {
  title: { absolute: 'CE Shield — Rehab career intelligence + CE compliance' },
  description:
    `${siteStats.certCount} credentials scored across five career-path lenses — clinical, business, academic clinical, research, and healthtech. ${siteStats.citationTotal.toLocaleString()} curated citations. Built for physical and occupational therapists.`,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <LandingPageClient />;
}
