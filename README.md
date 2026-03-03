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

- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Unit Test Suite](#unit-test-suite)
- [Git Workflow](#git-workflow)
- [Web-App Version Tags](#web-app-version-tags)
- [Deployment](#deployment)
- [Dependency Versions](#dependency-versions)
- [Ways to Get a Solid Pod](#ways-to-get-a-solid-pod)
- [Guides](#guides)
- [Contributing](#contributing)
- [Contact](#contact)

## Project Overview

### Main capabilities

- Solid Pod login and registration flow
- File upload and pod resource operations
- SPARQL querying over Solid Pods and endpoints
- Query caching support
- Privacy/ACL access management

### Tech stack

- Vue 3 + Vite 6
- TypeScript
- Vuetify 3
- Pinia
- Inrupt Solid client/auth libraries
- Comunica SPARQL engine

## Quick Start

### Prerequisites

- Node.js 20+
- Yarn 1.x (repo currently uses `yarn.lock`)

### Install

```bash
yarn install
```

### Run locally

```bash
yarn dev
```

### Build production assets

```bash
yarn build
```

### Preview production build

```bash
yarn serve
```

## Scripts

| Script | Description |
| --- | --- |
| `yarn dev` | Start Vite development server |
| `yarn build` | Build production assets into `dist/` |
| `yarn serve` | Preview the production build locally |
| `yarn test:unit` | Run unit tests (Node built-in runner + TS loader) |
| `yarn test:unit:watch` | Run unit tests in watch mode |
| `yarn test:unit:coverage` | Run unit tests with coverage report generation |
| `yarn test:unit:compliance` | Enforce unit-test + coverage thresholds |
| `yarn test:component` | Run Vue component tests (`.vue`) via Vitest |
| `yarn test:component:watch` | Run Vue component tests in watch mode |
| `yarn test:component:coverage` | Run Vue component tests with coverage |
| `yarn test:component:compliance` | Enforce Vue component test coverage thresholds |
| `yarn test:compliance` | Run both unit and component compliance checks |
| `yarn hooks:install` | Configure local git hooks path (`.githooks`) |
| `yarn github-post-build` | Create route-compatible `index.html` copies in `dist/` |
| `yarn deploy` | Publish `dist/` to GitHub Pages |

## Unit Test Suite

The project includes a unit test suite under `tests/unit/`.

### Current coverage focus

- Upload helper behavior (`fileUploadUtils.ts`)
- Query utility behavior (`queryPodUtils.ts`)
- COI fetch wrapper behavior (`z3-headers.ts`)
- Auth/session workflow behavior (`login.ts`)
- Data-access error-path behavior (`getData.ts`)
- Privacy utility/error-path behavior (`privacyEdit.ts`)

### Run tests

```bash
yarn test:unit
```

### Run Vue component tests

```bash
yarn test:component
```

Component suite includes:

- focused behavior tests for `ThemeSwitch` and `TheFooter` inside `tests/components/AllComponentsSmoke.test.ts`
- an all-components smoke suite in the same file that mounts every `.vue` file under `src/components/**`

### Coverage tracker

```bash
yarn test:unit:coverage
```

This command:

- runs the full unit-test suite with Node coverage enabled
- writes machine-readable output to `coverage/unit-coverage-summary.json`
- writes a readable summary to `coverage/unit-coverage-summary.txt`

### Compliance thresholds

```bash
yarn test:unit:compliance
yarn test:component:compliance
```

Default enforced thresholds for tracked files:

- line coverage: `98%`
- branch coverage: `90%`
- function coverage: `100%`

Tracked (gating) files:

- `src/components/fileUploadUtils.ts`
- `src/components/mime_types.js`
- `src/components/queryPodUtils.ts`
- `src/components/z3-headers.ts`

Advisory (non-gating) coverage is also reported for:

- `src/components/login.ts`
- `src/components/getData.ts`
- `src/components/privacyEdit.ts`

You can override thresholds with env vars:

- `UNIT_COVERAGE_LINES`
- `UNIT_COVERAGE_BRANCHES`
- `UNIT_COVERAGE_FUNCS`

## Git Workflow

### Commit-time compliance check

A pre-commit hook is defined at `.githooks/pre-commit` and runs:

```bash
yarn test:compliance
```

Install hooks locally:

```bash
yarn hooks:install
```

If automatic hook setup is blocked in your environment, run:

```bash
git config --local core.hooksPath .githooks
```

### CI compliance check

GitHub Actions workflow `.github/workflows/unit-test-compliance.yml` also enforces:

- unit tests passing
- component tests passing
- coverage thresholds passing

## Web-App Version Tags

### Current app version

- `package.json` version: `1.0.0`
- web-app release tag convention: `web-app-v<version>`
- current computed web-app tag: `web-app-v1.0.0`

### In-app visibility

The footer displays both:

- semantic app version (`vX.Y.Z`)
- computed web-app release tag (`web-app-vX.Y.Z`)

Both values are injected at build time from `package.json` via Vite defines.

### Recommended release workflow

1. Update version:

```bash
yarn version --new-version X.Y.Z
```

2. Build and validate:

```bash
yarn test:unit
yarn build
```

3. Create and push release tags:

```bash
git tag vX.Y.Z
git tag web-app-vX.Y.Z
git push origin vX.Y.Z web-app-vX.Y.Z
```

## Deployment

The project is configured for GitHub Pages deployment.

- `vite.config.js` uses `/solid-cockpit/` base path for production
- `yarn github-post-build` prepares route folders in `dist/`
- `yarn deploy` publishes `dist/` via `gh-pages`

## Dependency Versions

Below are the direct dependency versions currently declared in `package.json`.

### Runtime dependencies

| Package | Version |
| --- | --- |
| `@comunica/context-entries` | `^4.2.0` |
| `@comunica/logger-pretty` | `^4.2.0` |
| `@comunica/query-sparql` | `^4.3.0` |
| `@comunica/query-sparql-solid` | `^4.0.2` |
| `@inrupt/solid-client` | `2.1.2` |
| `@inrupt/solid-client-authn-browser` | `3.1.0` |
| `@inrupt/solid-client-authn-node` | `^3.1.0` |
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

### Development dependencies

| Package | Version |
| --- | --- |
| `@tsconfig/node20` | `^20.1.5` |
| `@typescript-eslint/eslint-plugin` | `^5.4.0` |
| `@typescript-eslint/parser` | `^5.4.0` |
| `eslint` | `^7.32.0` |
| `eslint-config-prettier` | `^8.3.0` |
| `eslint-plugin-prettier` | `^4.0.0` |
| `eslint-plugin-vue` | `^8.0.3` |
| `gh-pages` | `^5.0.0` |
| `prettier` | `^2.4.1` |
| `typescript` | `^5.0.0` |

## Ways to Get a Solid Pod

- [Community Solid Server](https://communitysolidserver.github.io/CommunitySolidServer/latest/): host a Pod locally or on your own server
- [Solidcommunity.net](https://solidcommunity.net/): community-hosted Solid Pods
- [Other Solid Pod Hosting Services](https://solidproject.org/for-developers#hosted-pod-services)

## Guides

### TRIPLE guide

See [TRIPLE-guide.md](./TRIPLE-guide.md).

### Solid Pod VoID file generation

Tool reference:

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

## Contributing

- Open pull requests against the `main` branch
- Use GitHub Issues for bug reports
- Use GitHub Discussions for broader questions and ideas

## Contact

- Discussions: <https://github.com/KNowledgeOnWebScale/solid-cockpit/discussions>
- Issues: <https://github.com/KNowledgeOnWebScale/solid-cockpit/issues>
