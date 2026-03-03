import { chmodSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const preCommitHookPath = ".githooks/pre-commit";

if (!existsSync(".git")) {
  console.log("Skipping git hook installation (.git directory not found).");
  process.exit(0);
}

if (!existsSync(preCommitHookPath)) {
  console.warn(`Pre-commit hook not found at ${preCommitHookPath}; skipping installation.`);
  process.exit(0);
}

try {
  execSync("git config --local core.hooksPath .githooks", { stdio: "ignore" });
  chmodSync(preCommitHookPath, 0o755);
  console.log("Git hooks installed (core.hooksPath=.githooks).");
} catch (error) {
  console.warn("Could not configure git hooks automatically in this environment.");
  console.warn("Run `git config --local core.hooksPath .githooks` manually if needed.");
}
