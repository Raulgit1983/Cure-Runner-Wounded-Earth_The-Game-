import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  test: {
    // Task worktrees are independent checkouts, not extra suites of this one.
    include: ['src/**/*.test.ts']
  }
});
