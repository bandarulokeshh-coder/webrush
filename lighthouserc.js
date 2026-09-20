// Lighthouse CI config — perf budget enforced in CI.
// This is the single biggest remaining lever on the FAIE score.
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      startServerCommand: 'npx vite preview --port 4173 --host',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'metrics:first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'metrics:largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'metrics:total-blocking-time': ['error', { maxNumericValue: 200 }],
        'metrics:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
};