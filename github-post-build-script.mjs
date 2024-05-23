import { cpSync } from 'fs';

const routes = [
  "/home",
  "/login",
  "/dataUpload",
  "/podBrowser",
  "dataQuery",
  "/privacy",
];


for (const route of routes) {
  cpSync(dir + "/index.html", "/dist" + route + "/index.html");
}
