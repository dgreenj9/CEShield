// Tailwind v4 split its PostCSS plugin into a separate package. Both CRA
// (via react-scripts' PostCSS pipeline) and Next.js consume this config.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
