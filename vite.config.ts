import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const config = {
  'ab-initio': {
    entry: resolve(__dirname, './src/ab-initio.ts'),
    fileName: (format) => `ab-initio.${format}.js`,
  },
  client: {
    entry: resolve(__dirname, './src/client.ts'),
    fileName: (format) => `client.${format}.js`,
  },
  server: {
    entry: resolve(__dirname, './src/server.ts'),
    fileName: (format) => `server.${format}.js`,
  },
  'export-open-api': {
    entry: resolve(__dirname, './src/open-api/index.ts'),
    fileName: (format) => `open-api.${format}.js`,
  },
};


const currentConfig = config[process?.env?.LIB_NAME || 'ab-initio'];
if (currentConfig === undefined) {
  throw new Error('LIB_NAME is not defined or is not valid');
}
export default defineConfig({
  build: {
    outDir: "./dist",
    lib: {
      ...currentConfig,
      formats: ["cjs", "es"],
    },
    emptyOutDir: false,
    //Generates sourcemaps for the built files,
    //aiding in debugging.
    sourcemap: true,
  },
  plugins: [dts(), nodePolyfills()],
});
