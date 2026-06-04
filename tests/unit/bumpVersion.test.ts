import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveNextVersion,
  updateCitationBib,
  updateCitationCff,
  updateReadmeVersionReferences,
} from "../../scripts/bump-version.mjs";

test("resolveNextVersion supports semver bump keywords and explicit versions", () => {
  assert.equal(resolveNextVersion("1.2.3", "patch"), "1.2.4");
  assert.equal(resolveNextVersion("1.2.3", "minor"), "1.3.0");
  assert.equal(resolveNextVersion("1.2.3", "major"), "2.0.0");
  assert.equal(resolveNextVersion("1.2.3", "4.5.6"), "4.5.6");
});

test("updateReadmeVersionReferences updates badges, citation text, and release workflow text", () => {
  const input = [
    "![Version](https://img.shields.io/badge/version-1.0.0-blue)",
    "![Web App Tag](https://img.shields.io/badge/web--app--tag-web--app--v1.0.0-0a7ea4)",
    "`Crum, E. (2026). Solid Cockpit (Version 1.0.0) [Software]. GitHub. https://github.com/KNowledgeOnWebScale/solid-cockpit`",
    "  version      = {1.0.0},",
    "- `package.json` version: `1.0.0`",
    "- web-app release tag convention: `web-app-v<version>`",
    "- current computed web-app tag: `web-app-v1.0.0`",
    "- Footer displays semantic version (`vX.Y.Z`) and computed release tag (`web-app-vX.Y.Z`)",
    "npm version X.Y.Z",
    "git tag web-app-vX.Y.Z\ngit push origin vX.Y.Z web-app-vX.Y.Z",
  ].join("\n");

  const updated = updateReadmeVersionReferences(input, "1.2.1");

  assert.match(updated, /badge\/version-1\.2\.1-blue/);
  assert.match(updated, /web--app--tag-v1\.2\.1-0a7ea4/);
  assert.match(updated, /Version 1\.2\.1/);
  assert.match(updated, /version\s+=\s+\{1\.2\.1\},/);
  assert.match(updated, /`package\.json` version: `1\.2\.1`/);
  assert.match(updated, /release tag convention: `v<version>`/);
  assert.match(updated, /`v1\.2\.1`/);
  assert.match(updated, /Footer displays semantic version \(`vX\.Y\.Z`\)\./);
  assert.match(updated, /npm run version:bump -- X\.Y\.Z/);
  assert.match(updated, /git push origin vX\.Y\.Z/);
});

test("citation helpers update version and release date fields", () => {
  assert.equal(
    updateCitationCff('version: "1.0.0"\ndate-released: 2026-03-04\n', "1.2.1", "2026-06-04"),
    'version: "1.2.1"\ndate-released: 2026-06-04\n'
  );

  assert.equal(
    updateCitationBib("  version      = {1.0.0},\n", "1.2.1"),
    "  version      = {1.2.1},\n"
  );
});
