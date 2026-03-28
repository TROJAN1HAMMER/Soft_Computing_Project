import { defineConfig } from 'vite';

export default defineConfig({
  // Silence esbuild warnings during dev
  optimizeDeps: {
    esbuildOptions: {
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      }
    }
  },
  // Silence Rollup warnings during build
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "use client" directives natively thrown by MUI & Framer Motion
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.message.includes('use client')) {
          return;
        }
        warn(warning);
      }
    }
  }
});
