import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import commonjs from 'vite-plugin-commonjs';
import { NgmiPolyfill } from 'vite-plugin-ngmi-polyfill';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		viteTsconfigPaths(),
		svgrPlugin(),
		commonjs(),
		NgmiPolyfill(),
	],
});
