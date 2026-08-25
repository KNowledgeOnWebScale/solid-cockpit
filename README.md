![Solid Cockpit Header Logo](./src/assets/full-sc-logo.png "SC Logo")

# Solid Cockpit
![Version](https://img.shields.io/badge/version-1.4.0-blue)
![Vue](https://img.shields.io/badge/vue-3.5.41-42b883)
![Vite](https://img.shields.io/badge/vite-8.2.2-646cff)
![License](https://img.shields.io/badge/license-MIT-green)

Solid Cockpit is a Vue web application for interacting with Solid Pods: authentication, data upload, pod browsing, SPARQL query execution, query caching, and privacy/ACL management.

## Table of Contents

- [Users](#users)
- [Privacy and Activity Measurement](#privacy-and-activity-measurement)
- [Developers](#developers)

## Privacy and Activity Measurement

The public deployment uses GoatCounter to measure basic application activity, such as page visits and aggregate browser usage. The app sends only the route path for a page view; it does not send query text, URL query strings, WebIDs, Pod URLs, file contents, or authentication data. GoatCounter's standard reporting may also aggregate browser, operating system, country, language, and screen-width information. GoatCounter does not use cookies or local storage for visitor tracking, and its standard reporting stores aggregate data rather than individual pageview records. The tracker remains disabled in builds where `VITE_GOATCOUNTER_ENDPOINT` is not configured.

For details, see GoatCounter's [GDPR guidance](https://www.goatcounter.com/help/gdpr) and [privacy policy](https://www.goatcounter.com/help/privacy).

## Users

### What Solid Cockpit Does

Main capabilities:

- Solid Pod login, session display, and pod registration/selection
- File upload to typed or browsed pod container destinations
- Pod browsing with filtering, metadata inspection, download, move, rename, and delete operations
- SPARQL querying over Solid Pods, SPARQL endpoints, and mixed/federated sources
- Query cache records with result previews, filtering, sorting, rename, sharing, and deletion
- Privacy/ACL management with shared-with-me/shared-with-others records, notifications, and scheduled revocation

### Accessing the App

Public deployment:

- <https://knowledgeonwebscale.github.io/solid-cockpit>

If you want to run locally, see [Developers](#developers).

### Ways to Get a Solid Pod

- [Community Solid Server](https://communitysolidserver.github.io/CommunitySolidServer/latest/): host a Pod locally or on your own server
- [Solidcommunity.net](https://solidcommunity.net/): community-hosted Solid Pods
- [Other Solid Pod Hosting Services](https://solidproject.org/for-developers#hosted-pod-services)

### Usage Guides

In-app guides are available from the relevant page:

- `Home`: app overview and embedded video demonstration
- `Data Upload`: upload destination and file upload workflow
- `Pod Browser`: container browsing and resource operations
- `Data Query`: query execution, examples, query URLs, and cache workflow
- `Privacy Editing`: ACL editing, notifications, sharing records, and revocation scheduling

### Citation

If you use this tool in an academic publication, you can cite:

`Crum, E. (2026). Solid Cockpit (Version 1.4.0) [Software]. GitHub. https://github.com/KNowledgeOnWebScale/solid-cockpit`

BibTeX:

```bibtex
@misc{solidcockpit_2026,
  author       = {Crum, Elias},
  title        = {{Solid Cockpit}},
  year         = {2026},
  version      = {1.4.0},
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

- Vue 3 + Vite 8
- TypeScript
- Vuetify 3
- Pinia
- Inrupt Solid client/auth libraries
- Comunica SPARQL engine
- YASQE/YASR query editor and result viewers
- npm-managed dependency workflow

### Source Layout

- `src/components/`: Vue UI components only
- `src/services/solid/`: Solid auth, pod access, upload, and ACL helper modules
- `src/services/query/`: query execution, parsing, and worker code
- `src/stores/`: Pinia state modules
- `src/assets/`: Vite-managed application assets such as icons and logos
- `public/`: files that must retain stable URLs at runtime, including Solid client metadata and the Z3 runtime
- `scripts/`: repository tooling, coverage checks, versioning, and GitHub Pages route preparation
- `demonstrator/`: example query files loaded by the query editor

### Prerequisites

- Node.js 24.19.0 LTS
- npm 11.17+ (repo now uses `package-lock.json`)
- Do not use Yarn for this repo; npm is the supported package manager.

Node 24 note:
- `@inrupt/solid-client@3.x` currently declares support for Node `^20 || ^22`; CI is pinned to Node 24.19.0, but npm may report a non-blocking engine warning for that package and a few legacy transitive packages.

### Local Setup

Install dependencies:

```bash
npm install
```

Enable activity measurement locally, if desired, by setting the public GoatCounter endpoint in `.env`:

```bash
VITE_GOATCOUNTER_ENDPOINT=https://solidcockpit.goatcounter.com/count
```

The deployed GitHub Pages build uses `https://solidcockpit.goatcounter.com/count`. This endpoint is not a secret; it identifies the GoatCounter site receiving aggregate pageview data.

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

- `package.json` version: `1.4.0`
- release tag convention: `v<version>`
- current computed release tag: `v1.4.0`

In-app visibility:

- Footer displays semantic version (`vX.Y.Z`).
- Values are injected at build time from `package.json` via Vite defines

Recommended release workflow:

1. Update version:

```bash
npm run version:bump -- X.Y.Z
```

2. Build and validate:

```bash
npm run test:unit
npm run build:highmem
```

3. Create and push release tags:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
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
| `@comunica/context-entries` | `^5.3.0` |
| `@comunica/logger-pretty` | `^5.3.0` |
| `@comunica/query-sparql` | `^5.3.0` |
| `@comunica/query-sparql-link-traversal-solid` | `^0.8.0` |
| `@comunica/query-sparql-solid` | `^5.0.1` |
| `@inrupt/solid-client` | `^3.0.0` |
| `@inrupt/solid-client-authn-browser` | `^5.0.0` |
| `@inrupt/solid-client-authn-node` | `^5.0.0` |
| `@mdi/font` | `^7.4.47` |
| `@triply/yasqe` | `^4.2.28` |
| `@triply/yasr` | `^4.2.28` |
| `@vitejs/plugin-vue` | `^6.0.8` |
| `actor-query-process-remote-cache` | `^0.1.2` |
| `core-js` | `^3.50.0` |
| `fs` | `^0.0.1-security` |
| `jsonld` | `^9.0.0` |
| `material-icons` | `^1.13.14` |
| `n3` | `^2.4.0` |
| `papaparse` | `^5.7.0` |
| `pinia` | `^4.0.3` |
| `query-sparql-remote-cache` | `^0.0.9` |
| `sparqljs` | `^3.7.4` |
| `vite` | `^8.2.2` |
| `vue` | `^3.5.41` |
| `vue-router` | `^5.2.0` |
| `vuetify` | `^3.13.2` |
| `z3-solver` | `^4.16.0` |

Development dependencies:

| Package | Version |
| --- | --- |
| `@tsconfig/node24` | `^24.0.5` |
| `@typescript-eslint/eslint-plugin` | `^8.68.0` |
| `@typescript-eslint/parser` | `^8.68.0` |
| `@vitest/coverage-istanbul` | `^4.1.11` |
| `@vue/eslint-config-typescript` | `^14.9.0` |
| `@vue/test-utils` | `^2.4.11` |
| `esbuild` | `^0.28.2` |
| `eslint` | `^10.9.1` |
| `eslint-config-prettier` | `^10.1.8` |
| `eslint-plugin-prettier` | `^5.5.6` |
| `eslint-plugin-vue` | `^10.10.0` |
| `gh-pages` | `^6.3.0` |
| `jsdom` | `^30.0.1` |
| `prettier` | `^3.9.6` |
| `typescript` | `^5.9.3` |
| `vitest` | `^4.1.11` |

### Contributing

- Open pull requests against the `main` branch
- Use GitHub Issues for bug reports
- Use GitHub Discussions for broader questions and ideas
