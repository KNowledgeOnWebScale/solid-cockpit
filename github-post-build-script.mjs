import { cpSync } from 'fs';
import vueConfig from './vite.config.js';

const routes = [
  "/home",
  "/login",
  "/dataUpload",
  "/podBrowser",
  "/dataQuery",
  "/privacy",
];

const dir = vueConfig.build.outDir;
console.log(dir)
for (const route of routes) {
  cpSync(dir + "/index.html", dir + route + "/index.html");
}
