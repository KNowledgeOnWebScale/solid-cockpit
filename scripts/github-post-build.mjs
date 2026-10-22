import { cpSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

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

// Disable Jekyll on GitHub Pages, which drops files starting with "_" (e.g. Vite's _plugin-vue_export-helper chunk).
writeFileSync(join(dir, '.nojekyll'), '');
