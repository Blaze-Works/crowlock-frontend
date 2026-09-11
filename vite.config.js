// vite.config.js

import { defineConfig } from 'vite';

export default defineConfig( {
    build: {
        manifest: true,
        outDir: 'dist',
        minify: 'terser',
        rollupOptions: {
            input: {
                app: './public/js/app.js'
            }
        }
    }
});
