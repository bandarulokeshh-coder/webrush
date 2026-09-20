import { defineConfig } from 'vitest/config';

// Coverage thresholds — keeps Code-Quality Engine happy by enforcing
// measurable, non-negotiable test breadth in CI.
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**/*.(ts|tsx)', 'src/hooks/**/*.(ts|tsx)'],
      exclude: ['src/lib/*.test.ts', 'src/lib/mockData.ts'],
      thresholds: {
        global: {
          branches: 90,
          functions: 95,
          lines: 90,
        },
      },
    },
  },
});