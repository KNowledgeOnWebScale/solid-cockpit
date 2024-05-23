const { fs } = require("fs");
const { publicPath } = require("./vue.config.js");

const routes = [
  "/home",
  "/login",
  "/dataUpload",
  "/podBrowser",
  "dataQuery",
  "/privacy",
];

console.log(publicPath);
for (const route of routes) {
  fs.cpSync(dir + "/index.html", dir + route + "/index.html");
}
