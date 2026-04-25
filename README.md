![Solid Cockpit Header Logo](./src/assets/full-sc-logo.png "SC Logo")

# Solid Cockpit

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Web App Tag](https://img.shields.io/badge/web--app--tag-web--app--v1.0.0-0a7ea4)
![Vue](https://img.shields.io/badge/vue-3.2.13-42b883)
![Vite](https://img.shields.io/badge/vite-6.2.3-646cff)
![License](https://img.shields.io/badge/license-MIT-green)

Solid Cockpit is a web application for interacting with Solid Pods: authentication, data upload, query execution, and privacy management.

This application was developed in the context of the CHIST-ERA TRIPLE project.

## Table of Contents

- [Users](#users)
- [Developers](#developers)

## Users

### What Solid Cockpit Does

Main capabilities:

- Solid Pod login and registration flow
- File upload and pod resource operations
- SPARQL querying over Solid Pods and endpoints
- Query caching support
- Privacy/ACL access management

### Accessing the App

Public deployment:

- <https://knowledgeonwebscale.github.io/solid-cockpit>

If you want to run locally, see [Developers](#developers).

### Ways to Get a Solid Pod

- [Community Solid Server](https://communitysolidserver.github.io/CommunitySolidServer/latest/): host a Pod locally or on your own server
- [Solidcommunity.net](https://solidcommunity.net/): community-hosted Solid Pods
- [Other Solid Pod Hosting Services](https://solidproject.org/for-developers#hosted-pod-services)

### Usage Guides

TRIPLE onboarding guide:

- [TRIPLE-guide.md](./TRIPLE-guide.md)

Solid Pod VoID file generation:

- <https://github.com/JervenBolleman/void-generator/tree/solid-pod-support>

Example:

```bash
mvn package
java -jar target/void-generator-0.7-SNAPSHOT-uber.jar \
  --from-solid-pod [URL-to-solid-pod] \
  --void-file void.ttl \
  -i [URL-to-solid-pod]/void.ttl \
  --repository [URL-to-solid-pod]
```

Then upload `void.ttl` to the pod root using the app's `Data Upload` page.

### Citation

If you use this tool in an academic publication, you can cite:

`Crum, E. (2026). Solid Cockpit (Version 1.0.0) [Software]. GitHub. https://github.com/KNowledgeOnWebScale/solid-cockpit`

BibTeX:

```bibtex
@misc{solidcockpit_2026,
  author       = {Crum, Elias},
  title        = {{Solid Cockpit}},
  year         = {2026},
  version      = {1.0.0},
  publisher    = {GitHub},
  howpublished = {\url{https://github.com/KNowledgeOnWebScale/solid-cockpit}},
  note         = {Software. Web app: \url{https://knowledgeonwebscale.github.io/solid-cockpit}. Accessed: 2026-03-04}
}
```

You can also use:

- `CITATION.cff` for GitHub-style citation metadata
- `CITATION.bib` for direct BibTeX import

### Contact and Support

- Discussions: <https://github.com/KNowledgeOnWebScale/solid-cockpit/discussions>
- Issues: <https://github.com/KNowledgeOnWebScale/solid-cockpit/issues>

## Developers

### Tech Stack

- Vue 3 + Vite 6
- TypeScript
- Vuetify 3
- Pinia
- Inrupt Solid client/auth libraries
- Comunica SPARQL engine

### Source Layout

- `src/components/`: Vue UI components only
- `src/services/solid/`: Solid auth, pod access, upload, and ACL helper modules
- `src/services/query/`: query execution, parsing, and worker code
- `src/stores/`: Pinia state modules

### Prerequisites

- Node.js 22.x (LTS recommended)
- npm 10+ (repo now uses `package-lock.json`)

Node 24 note:
- `@inrupt/solid-client@3.x` currently declares support for Node `^20 || ^22`, so this repo pins to Node 22 for strict engine compatibility.

### Local Setup

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

If you hit a Node heap out-of-memory error during production builds, rerun with an increased heap size:

```bash
NODE_OPTIONS=--max-old-space-size=8192 npm run build
```

Preview production build:

```bash
npm run serve
```

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite development server |
| `npm run build` | Build production assets into `dist/` |
| `npm run build:highmem` | Build production assets with an 8GB Node heap |
| `npm run serve` | Preview the production build locally |
| `npm run test:unit` | Run unit tests (Node built-in runner + TS loader) |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:unit:coverage` | Run unit tests with coverage report generation |
| `npm run test:unit:compliance` | Enforce unit-test + coverage thresholds |
| `npm run test:unit:compliance:quiet` | Enforce unit coverage with concise output |
| `npm run test:component` | Run Vue component tests (`.vue`) via Vitest |
| `npm run test:component:watch` | Run Vue component tests in watch mode |
| `npm run test:component:coverage` | Run Vue component tests with coverage |
| `npm run test:component:compliance` | Enforce Vue component test coverage thresholds |
| `npm run test:component:compliance:quiet` | Enforce component coverage with concise output |
| `npm run test:compliance` | Run full (unit + component) compliance checks |
| `npm run test:compliance:quiet` | Run full compliance checks with concise output |
| `npm run hooks:install` | Configure local git hooks path (`.githooks`) |
| `npm run github-post-build` | Create route-compatible `index.html` copies in `dist/` |
| `npm run deploy` | Publish `dist/` to GitHub Pages |

### Testing and Coverage

Unit test suite:

- Location: `tests/unit/`
- Command: `npm run test:unit`

Component test suite:

- Location: `tests/components/`
- Command: `npm run test:component`
- Includes focused `ThemeSwitch` + `TheFooter` tests and full `.vue` smoke mounts in `tests/components/AllComponentsSmoke.test.ts`

Coverage tracker:

```bash
npm run test:unit:coverage
```

This command:

- runs the unit test suite with Node coverage enabled
- writes machine-readable output to `coverage/unit-coverage-summary.json`
- writes a readable summary to `coverage/unit-coverage-summary.txt`

Compliance thresholds (gating):

- line coverage: `98%`
- branch coverage: `90%`
- function coverage: `100%`

Tracked files:

- `src/services/solid/fileUploadUtils.ts`
- `src/services/solid/mime_types.js`
- `src/services/query/queryPodUtils.ts`
- `src/services/query/z3-headers.ts`

Advisory (non-gating) coverage is also reported for:

- `src/services/solid/login.ts`
- `src/services/solid/getData.ts`
- `src/services/solid/privacyEdit.ts`

Override thresholds with env vars:

- `UNIT_COVERAGE_LINES`
- `UNIT_COVERAGE_BRANCHES`
- `UNIT_COVERAGE_FUNCS`

### Git Workflow

Commit-time compliance check:

- Hook file: `.githooks/pre-commit`
- Command run by hook: `node ./scripts/precommit-compliance.mjs`
- Hook output is intentionally concise on pass and detailed on failure.

Install hooks locally:

```bash
npm run hooks:install
```

If automatic hook setup is blocked in your environment:

```bash
git config --local core.hooksPath .githooks
```

CI compliance check:

- Workflow: `.github/workflows/unit-test-compliance.yml`
- Enforces unit tests, component tests, and coverage thresholds.

### Web-App Version Tags

Current app version:

- `package.json` version: `1.0.0`
- web-app release tag convention: `web-app-v<version>`
- current computed web-app tag: `web-app-v1.0.0`

In-app visibility:

- Footer displays semantic version (`vX.Y.Z`) and computed release tag (`web-app-vX.Y.Z`)
- Values are injected at build time from `package.json` via Vite defines

Recommended release workflow:

1. Update version:

```bash
npm version X.Y.Z
```

2. Build and validate:

```bash
npm run test:unit
npm run build:highmem
```

3. Create and push release tags:

```bash
git tag vX.Y.Z
git tag web-app-vX.Y.Z
git push origin vX.Y.Z web-app-vX.Y.Z
```

### Deployment

GitHub Pages deployment setup:

- `vite.config.js` uses `/solid-cockpit/` base path for production
- `npm run github-post-build` prepares route folders in `dist/`
- `npm run deploy` publishes `dist/` via `gh-pages`

### Dependency Versions

Direct dependency versions currently declared in `package.json`.

Runtime dependencies:

| Package | Version |
| --- | --- |
| `@comunica/context-entries` | `^5.2.0` |
| `@comunica/logger-pretty` | `^5.2.0` |
| `@comunica/query-sparql` | `^5.2.0` |
| `@comunica/query-sparql-solid` | `^5.0.1` |
| `@inrupt/solid-client` | `^3.0.0` |
| `@inrupt/solid-client-authn-browser` | `^4.0.0` |
| `@inrupt/solid-client-authn-node` | `^4.0.0` |
| `@triply/yasqe` | `^4.2.28` |
| `@triply/yasr` | `^4.2.28` |
| `@vitejs/plugin-vue` | `^5.2.3` |
| `@vue/eslint-config-typescript` | `^9.1.0` |
| `actor-query-process-remote-cache` | `^0.1.0` |
| `core-js` | `^3.8.3` |
| `fs` | `^0.0.1-security` |
| `pinia` | `^2.3.1` |
| `query-sparql-remote-cache` | `^0.0.9` |
| `sparqljs` | `^3.7.3` |
| `vite` | `^6.2.3` |
| `vue` | `^3.2.13` |
| `vue-router` | `^4.5.1` |
| `vuetify` | `^3.5.14` |
| `z3-solver` | `^4.15.3` |

Development dependencies:

| Package | Version |
| --- | --- |
| `@tsconfig/node22` | `^22.0.2` |
| `@typescript-eslint/eslint-plugin` | `^5.4.0` |
| `@typescript-eslint/parser` | `^5.4.0` |
| `@vitest/coverage-istanbul` | `2.1.9` |
| `@vue/test-utils` | `2.4.6` |
| `eslint` | `^7.32.0` |
| `eslint-config-prettier` | `^8.3.0` |
| `eslint-plugin-prettier` | `^4.0.0` |
| `eslint-plugin-vue` | `^8.0.3` |
| `gh-pages` | `^5.0.0` |
| `jsdom` | `24.1.3` |
| `prettier` | `^2.4.1` |
| `typescript` | `^5.0.0` |
| `vitest` | `2.1.9` |

### Contributing

- Open pull requests against the `main` branch
- Use GitHub Issues for bug reports
- Use GitHub Discussions for broader questions and ideas
