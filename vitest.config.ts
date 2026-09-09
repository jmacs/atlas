import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'fixtures/**/*.test.ts',
      'lib/**/*.test.ts',
      'src/**/*.test.ts',
      'src/apps/**/*.test.tsx',
    ],
  },
});
