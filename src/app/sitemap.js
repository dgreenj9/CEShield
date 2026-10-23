// Sitemap for SEO. Includes marketing pages + all SSG state landing pages.
// Next will serve this at /sitemap.xml at build time.

import { allStateLicenseEntries } from '@/data/stateRules';
import citationsMeta from '@/data/citations_meta.json';

const SITE = 'https://ceshield.com';

export default function sitemap() {
  const now = new Date().toISOString();
  const staticRoutes = [
    { url: SITE + '/',              priority: 1.0,  changeFrequency: 'weekly' },
    { url: SITE + '/matrix',        priority: 0.9,  changeFrequency: 'monthly' },
    { url: SITE + '/career-paths',  priority: 0.9,  changeFrequency: 'monthly' },
    { url: SITE + '/methodology',   priority: 0.9,  changeFrequency: 'monthly' },
    { url: SITE + '/about',         priority: 0.6,  changeFrequency: 'yearly' },
    { url: SITE + '/states',        priority: 0.8,  changeFrequency: 'monthly' },
    { url: SITE + '/credentials',   priority: 0.9,  changeFrequency: 'monthly' },
    { url: SITE + '/learn',         priority: 0.9,  changeFrequency: 'weekly' },
  ].map((r) => ({ ...r, lastModified: now }));

  const stateRoutes = allStateLicenseEntries().map((e) => ({
    url: `${SITE}/states/${e.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const credentialRoutes = Object.values(citationsMeta)
    .filter((e) => e?.slug)
    .map((e) => ({
      url: `${SITE}/credentials/${e.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

  return [...staticRoutes, ...stateRoutes, ...credentialRoutes];
}
