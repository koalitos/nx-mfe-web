/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => {
  const previewPort = Number(process.env.PORT ?? 4173);
  const allowedHosts =
    process.env.VITE_ALLOWED_HOSTS?.split(',').map((host) => host.trim()).filter(Boolean) ?? [];
  allowedHosts.push('nx-mfe-web-production.up.railway.app');

  return {
    root: __dirname,
    cacheDir: '../node_modules/.vite/web',
    server: {
      port: 4200,
      host: '0.0.0.0',
    },
    preview: {
      port: previewPort,
      host: '0.0.0.0',
      allowedHosts,
    },
    plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    build: {
      outDir: '../dist/web',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
    },
  };
});
