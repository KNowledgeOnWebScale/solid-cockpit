import viteConfig from "./vite.config.js";
import * as fs from "fs";

const routes = [
  "/menu",
  "/watch",
  "/auth",
];
const dir = viteConfig.build.outDir;
for (const route of routes) {
  fs.cpSync(dir + "/index.html", dir + route + "/index.html");
}