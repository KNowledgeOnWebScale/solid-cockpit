import { spawnSync } from "node:child_process";

function runStep(label, command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });

  if (result.status !== 0) {
    console.error(`\n${label}: FAIL`);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

console.log("Running pre-commit compliance checks...");

runStep("Unit compliance", process.execPath, [
  "./scripts/unit-coverage.mjs",
  "--enforce",
  "--quiet",
]);

runStep("Component compliance", process.execPath, [
  "./node_modules/vitest/vitest.mjs",
  "run",
  "--coverage",
  "--config",
  "./vitest.config.ts",
  "--reporter=dot",
  "--coverage.reporter=json-summary",
  "--coverage.reportsDirectory=coverage/component",
]);

console.log("All pre-commit compliance checks passed.");
