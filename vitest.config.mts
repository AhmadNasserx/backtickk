import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url)).replace(/[\\/]$/, '');

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup/auth-mock.ts'],
    testTimeout: 30000,
    hookTimeout: 120000,
    // Integration files each start their own in-memory MongoDB; running them one at a time keeps runs deterministic.
    fileParallelism: false,
  },
});
