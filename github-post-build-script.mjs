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
  cpSync("/TRIPLE_App/dist" + "/index.html", "/TRIPLE_App/dist" + route + "/index.html");
}
