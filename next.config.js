/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Force HTTPS for a year, including subdomains.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // This app is never legitimately embedded in a frame.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Minimal CSP: frame-ancestors covers clickjacking on browsers that
  // ignore X-Frame-Options. A full default-src policy needs an audit of
  // inline styles + Supabase/Google Fonts origins first — tracked separately.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
