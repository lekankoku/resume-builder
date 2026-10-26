import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'worker/**/*.test.ts'],
    setupFiles: ['src/testing/setupDom.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/application/**', 'src/infrastructure/**', 'worker/**'],
      exclude: ['src/application/ports/**', 'src/infrastructure/seed/**', 'worker/testing.ts', 'worker/index.ts', '**/*.test.ts'],
    },
  },
});
