import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure-logic unit + data-integrity tests. Scoped to the test directory so
    // stray files elsewhere can't pull React/DOM deps into a node test run.
    include: ['src/**/__tests__/**/*.test.{js,jsx}'],
    environment: 'node',
  },
});
