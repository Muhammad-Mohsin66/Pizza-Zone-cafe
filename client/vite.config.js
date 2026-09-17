import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    headers: {
      'Content-Security-Policy': "default-src 'self'; img-src 'self' http://localhost:5001 http://localhost:5000 https://images.unsplash.com https://plus.unsplash.com https://res.cloudinary.com data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; connect-src 'self' http://localhost:5001 http://localhost:5000; frame-src 'self' https://www.google.com https://maps.google.com;"
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
