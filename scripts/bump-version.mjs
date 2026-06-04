import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const VERSION_RE = /^\d+\.\d+\.\d+$/;

export function resolveNextVersion(currentVersion, requestedVersion) {
  if (!requestedVersion) {
    throw new Error("Provide a version like 1.2.3 or a bump keyword: patch, minor, major.");
  }

  if (VERSION_RE.test(requestedVersion)) {
    return requestedVersion;
  }

  const parts = currentVersion.split(".").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    throw new Error(`Current package version is not valid semver: ${currentVersion}`);
  }

  const [major, minor, patch] = parts;
  switch (requestedVersion) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      throw new Error(
        `Unsupported bump target "${requestedVersion}". Use major, minor, patch, or an explicit X.Y.Z version.`
      );
  }
}

export function updateReadmeVersionReferences(content, version) {
  const releaseTag = `v${version}`;
  return content
    .replace(
      /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^)]+-blue\)/,
      `![Version](https://img.shields.io/badge/version-${version}-blue)`
    )
    .replace(
      /!\[Web App Tag\]\(https:\/\/img\.shields\.io\/badge\/web--app--tag-[^)]+-0a7ea4\)/,
      `![Web App Tag](https://img.shields.io/badge/web--app--tag-${releaseTag}-0a7ea4)`
    )
    .replace(
      /`Crum, E\. \(2026\)\. Solid Cockpit \(Version [^)]+\) \[Software\]\. GitHub\. https:\/\/github\.com\/KNowledgeOnWebScale\/solid-cockpit`/,
      `\`Crum, E. (2026). Solid Cockpit (Version ${version}) [Software]. GitHub. https://github.com/KNowledgeOnWebScale/solid-cockpit\``
    )
    .replace(/version\s+=\s+\{[^}]+\},/, `version      = {${version}},`)
    .replace(/- `package\.json` version: `[^`]+`/, `- \`package.json\` version: \`${version}\``)
    .replace(/- web-app release tag convention: `[^`]+`/, `- release tag convention: \`v<version>\``)
    .replace(/- current computed web-app tag: `[^`]+`/, `- current computed release tag: \`${releaseTag}\``)
    .replace(/- Footer displays semantic version \(`vX\.Y\.Z`\) and computed release tag \(`[^`]+`\)/, "- Footer displays semantic version (`vX.Y.Z`).")
    .replace(/npm version X\.Y\.Z/, "npm run version:bump -- X.Y.Z")
    .replace(/git tag web-app-vX\.Y\.Z\ngit push origin vX\.Y\.Z web-app-vX\.Y\.Z/, "git push origin vX.Y.Z");
}

export function updateCitationCff(content, version, releaseDate) {
  return content
    .replace(/version:\s+"[^"]+"/, `version: "${version}"`)
    .replace(/date-released:\s+\d{4}-\d{2}-\d{2}/, `date-released: ${releaseDate}`);
}

export function updateCitationBib(content, version) {
  return content.replace(/version\s+=\s+\{[^}]+\},/, `version      = {${version}},`);
}

function runVersionCommand(rootDir, nextVersion) {
  const result = spawnSync(
    "npm",
    ["version", nextVersion, "--no-git-tag-version", "--allow-same-version"],
    {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );

  if (result.status !== 0) {
    throw new Error(`npm version failed with exit code ${result.status ?? "unknown"}`);
  }
}

function syncStaticVersionReferences(rootDir, version, releaseDate) {
  const readmePath = resolve(rootDir, "README.md");
  const citationCffPath = resolve(rootDir, "CITATION.cff");
  const citationBibPath = resolve(rootDir, "CITATION.bib");

  writeFileSync(
    readmePath,
    updateReadmeVersionReferences(readFileSync(readmePath, "utf8"), version),
    "utf8"
  );
  writeFileSync(
    citationCffPath,
    updateCitationCff(readFileSync(citationCffPath, "utf8"), version, releaseDate),
    "utf8"
  );
  writeFileSync(
    citationBibPath,
    updateCitationBib(readFileSync(citationBibPath, "utf8"), version),
    "utf8"
  );
}

export function runBumpVersion(rootDir, requestedVersion, releaseDate = new Date().toISOString().slice(0, 10)) {
  const packageJsonPath = resolve(rootDir, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const currentVersion = packageJson.version ?? "0.0.0";
  const nextVersion = resolveNextVersion(currentVersion, requestedVersion);

  runVersionCommand(rootDir, nextVersion);
  syncStaticVersionReferences(rootDir, nextVersion, releaseDate);

  return {
    currentVersion,
    nextVersion,
    releaseTag: `v${nextVersion}`,
    releaseDate,
  };
}

const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule) {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

  try {
    const { currentVersion, nextVersion, releaseTag, releaseDate } = runBumpVersion(
      rootDir,
      process.argv[2]
    );

    console.log(
      [
        `Updated version ${currentVersion} -> ${nextVersion}`,
        `Release tag: ${releaseTag}`,
        `Release date: ${releaseDate}`,
      ].join("\n")
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
