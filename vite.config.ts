import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

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
  plugins: [dts()],
});

/*
export default defineConfig({
  build: {
    //Specifies that the output of the build will be a library.
    lib: {
      //Defines the entry point for the library build. It resolves 
      //to src/index.ts,indicating that the library starts from this file.
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "ab-initio",
      //A function that generates the output file
      //name for different formats during the build
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    //Generates sourcemaps for the built files,
    //aiding in debugging.
    sourcemap: true,
    //Clears the output directory before building.
    emptyOutDir: true,
  },
  //react() enables React support.
  //dts() generates TypeScript declaration files (*.d.ts)
  //during the build.
  plugins: [dts()],
});
*/