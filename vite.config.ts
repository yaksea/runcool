import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    // Avoid Windows excluded ranges (e.g. 5141–5240) that cause EACCES on 5173/5174.
    port: 6001,
    host: '127.0.0.1',
    strictPort: true,
    open: true,
  },
});
