import { resolve } from "path";

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,
    polyfillModulePreload: false,
    rollupOptions: {
      external: ["main.js"],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].js",
      },
      input: {
        main: resolve(__dirname, "index.html"),
        content_script: resolve(__dirname, "content_script.html"),
      },
    },
  },
})
