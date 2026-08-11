/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { iwsdkDev } from '@iwsdk/vite-plugin-dev';
import { defineConfig } from 'vite';

const httpsDisabled =
  process.env.IWSDK_DEV_HTTPS === 'false' || process.env.IWSDK_DEV_HTTPS === '0';

export default defineConfig(() => ({
  plugins: [iwsdkDev(httpsDisabled ? { https: false } : {})],
  define: {
    __APP_ENV__: JSON.stringify(
      process.env.VITE_VERCEL_ENV ?? process.env.VERCEL_ENV ?? 'development',
    ),
  },
  server: {
    host: '0.0.0.0',
    port: 8081,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    target: 'esnext',
    rollupOptions: { input: './index.html' },
  },
  esbuild: { target: 'esnext' },
  // UIKitML can otherwise resolve a second Three/UIKit graph under pnpm.
  // Duplicated Component classes reject Horizon children such as <Divider>.
  resolve: {
    dedupe: [
      'three',
      '@pmndrs/uikit',
      '@pmndrs/uikit-horizon',
      '@pmndrs/uikit-lucide',
    ],
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
    include: [
      '@pmndrs/uikit',
      '@pmndrs/uikit-horizon',
      '@pmndrs/uikit-lucide',
      '@drawcall/uikitml',
    ],
    esbuildOptions: { target: 'esnext' },
  },
  publicDir: 'public',
  base: './',
}));
