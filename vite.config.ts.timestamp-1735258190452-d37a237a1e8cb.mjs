// vite.config.ts
import path from "node:path";
import { createRequire } from "node:module";
import { defineConfig, normalizePath } from "file:///Users/first/Documents/GitHub/SyncBoard/.yarn/__virtual__/vite-virtual-e126461d35/4/.yarn/berry/cache/vite-npm-6.0.6-12ec70711a-10c0.zip/node_modules/vite/dist/node/index.js";
import react from "file:///Users/first/Documents/GitHub/SyncBoard/.yarn/__virtual__/@vitejs-plugin-react-virtual-35d368d736/4/.yarn/berry/cache/@vitejs-plugin-react-npm-4.3.4-e5f654de44-10c0.zip/node_modules/@vitejs/plugin-react/dist/index.mjs";
import svgr from "file:///Users/first/Documents/GitHub/SyncBoard/.yarn/__virtual__/vite-plugin-svgr-virtual-28e6916c96/4/.yarn/berry/cache/vite-plugin-svgr-npm-4.3.0-ded8bb690b-10c0.zip/node_modules/vite-plugin-svgr/dist/index.js";
import { viteStaticCopy } from "file:///Users/first/Documents/GitHub/SyncBoard/.yarn/__virtual__/vite-plugin-static-copy-virtual-75895f7b99/4/.yarn/berry/cache/vite-plugin-static-copy-npm-2.2.0-dee72db832-10c0.zip/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///Users/first/Documents/GitHub/SyncBoard/vite.config.ts";
var require2 = createRequire(__vite_injected_original_import_meta_url);
var pdfjsDistPath = path.dirname(require2.resolve("pdfjs-dist/package.json"));
var cMapsDir = normalizePath(path.join(pdfjsDistPath, "cmaps"));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    svgr(),
    viteStaticCopy({
      targets: [
        {
          src: cMapsDir,
          dest: ""
        }
      ]
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlUm9vdCI6ICIvVXNlcnMvZmlyc3QvRG9jdW1lbnRzL0dpdEh1Yi9TeW5jQm9hcmQvIiwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZmlyc3QvRG9jdW1lbnRzL0dpdEh1Yi9TeW5jQm9hcmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9maXJzdC9Eb2N1bWVudHMvR2l0SHViL1N5bmNCb2FyZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZmlyc3QvRG9jdW1lbnRzL0dpdEh1Yi9TeW5jQm9hcmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSBcIm5vZGU6bW9kdWxlXCI7XG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgc3ZnciBmcm9tIFwidml0ZS1wbHVnaW4tc3ZnclwiO1xuaW1wb3J0IHsgdml0ZVN0YXRpY0NvcHkgfSBmcm9tIFwidml0ZS1wbHVnaW4tc3RhdGljLWNvcHlcIjtcblxuY29uc3QgcmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUoaW1wb3J0Lm1ldGEudXJsKTtcblxuY29uc3QgcGRmanNEaXN0UGF0aCA9IHBhdGguZGlybmFtZShyZXF1aXJlLnJlc29sdmUoXCJwZGZqcy1kaXN0L3BhY2thZ2UuanNvblwiKSk7XG5jb25zdCBjTWFwc0RpciA9IG5vcm1hbGl6ZVBhdGgocGF0aC5qb2luKHBkZmpzRGlzdFBhdGgsIFwiY21hcHNcIikpO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgc3ZncigpLFxuICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgIHRhcmdldHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogY01hcHNEaXIsXG4gICAgICAgICAgZGVzdDogXCJcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSksXG4gIF0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVMsT0FBTyxVQUFVO0FBQ3hULFNBQVMscUJBQXFCO0FBRTlCLFNBQVMsY0FBYyxxQkFBcUI7QUFDNUMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHNCQUFzQjtBQU51SixJQUFNLDJDQUEyQztBQVF2TyxJQUFNQSxXQUFVLGNBQWMsd0NBQWU7QUFFN0MsSUFBTSxnQkFBZ0IsS0FBSyxRQUFRQSxTQUFRLFFBQVEseUJBQXlCLENBQUM7QUFDN0UsSUFBTSxXQUFXLGNBQWMsS0FBSyxLQUFLLGVBQWUsT0FBTyxDQUFDO0FBR2hFLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFNBQVM7QUFBQSxRQUNQO0FBQUEsVUFDRSxLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicmVxdWlyZSJdCn0K
