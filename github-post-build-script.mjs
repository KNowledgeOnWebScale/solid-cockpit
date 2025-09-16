import { cpSync, mkdirSync } from 'fs';

const routes = [
  "/home",
  "/login",
  "/dataUpload",
  "/podBrowser",
  "/dataQuery",
  "/privacy",
];

const dir = 'dist';
for (const route of routes) {
  const target = join(dir, route);
  mkdirSync(target, { recursive: true });
  cpSync(join(dir, 'index.html'), join(target, 'index.html'));
}
