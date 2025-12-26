
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // يضمن تحميل الملفات بمسارات نسبية صحيحة
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild', // نستخدم esbuild المدمج لتجنب خطأ نقص مكتبة terser
    target: 'esnext'
  },
  server: {
    historyApiFallback: true,
  }
});
