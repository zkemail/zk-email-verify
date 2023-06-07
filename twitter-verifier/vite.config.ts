import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import commonjs from "vite-plugin-commonjs";
import 'rollup-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    commonjs(),
  ],
  resolve: {
    alias: {
      timers: "rollup-plugin-node-polyfills/polyfills/timers",
      stream: "rollup-plugin-node-polyfills/polyfills/stream",
      util: "rollup-plugin-node-polyfills/polyfills/util",
      process: "rollup-plugin-node-polyfills/polyfills/process-es6",
      crypto: "crypto-browserify",
      buffer: "buffer",
    },
  },
  server: {
    port: 3000,
  },
});
