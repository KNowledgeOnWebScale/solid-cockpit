import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const enforce = args.has("--enforce");
const quiet = args.has("--quiet");

const lineThreshold = Number(process.env.UNIT_COVERAGE_LINES ?? "98");
const branchThreshold = Number(process.env.UNIT_COVERAGE_BRANCHES ?? "90");
const funcThreshold = Number(process.env.UNIT_COVERAGE_FUNCS ?? "100");

const trackedFiles = [
  "src/components/fileUploadUtils.ts",
  "src/components/mime_types.js",
  "src/components/queryPodUtils.ts",
  "src/components/z3-headers.ts",
];
const advisoryFiles = [
  "src/components/login.ts",
  "src/components/getData.ts",
  "src/components/privacyEdit.ts",
];

const testFiles = readdirSync("tests/unit")
  .filter((fileName) => fileName.endsWith(".test.ts"))
  .sort()
  .map((fileName) => `./tests/unit/${fileName}`);

const nodeResult = spawnSync(
  "node",
  [
    "--test",
    "--experimental-test-coverage",
    "--import",
    "./tests/register-ts-loader.mjs",
    ...testFiles,
  ],
  { encoding: "utf8" }
);

if (!quiet) {
  if (nodeResult.stdout) process.stdout.write(nodeResult.stdout);
  if (nodeResult.stderr) process.stderr.write(nodeResult.stderr);
}

if (nodeResult.status !== 0) {
  if (quiet) {
    if (nodeResult.stdout) process.stdout.write(nodeResult.stdout);
    if (nodeResult.stderr) process.stderr.write(nodeResult.stderr);
  }
  process.exit(nodeResult.status ?? 1);
}

const coverageRegex =
  /^#\s(.+?)\s\|\s([\d.]+)\s\|\s([\d.]+)\s\|\s([\d.]+)\s\|\s?(.*)$/;

const metricsByFile = new Map();
for (const line of nodeResult.stdout.split("\n")) {
  if (!line.startsWith("# ")) continue;
  if (line.includes("start of coverage report")) continue;
  if (line.includes("end of coverage report")) continue;
  if (line.includes("file | line % | branch % | funcs %")) continue;
  if (line.startsWith("# all files")) continue;

  const match = line.match(coverageRegex);
  if (!match) continue;

  const [, file, linePct, branchPct, funcPct, uncovered] = match;
  metricsByFile.set(file.trim(), {
    file: file.trim(),
    linePct: Number(linePct),
    branchPct: Number(branchPct),
    funcPct: Number(funcPct),
    uncovered: uncovered.trim(),
  });
}

const trackedMetrics = trackedFiles.map((file) => metricsByFile.get(file)).filter(Boolean);
const missingFiles = trackedFiles.filter((file) => !metricsByFile.has(file));
const advisoryMetrics = advisoryFiles
  .map((file) => metricsByFile.get(file))
  .filter(Boolean);
const missingAdvisoryFiles = advisoryFiles.filter((file) => !metricsByFile.has(file));

const summary = {
  generatedAt: new Date().toISOString(),
  thresholds: {
    linePct: lineThreshold,
    branchPct: branchThreshold,
    funcPct: funcThreshold,
  },
  trackedFiles,
  advisoryFiles,
  metrics: trackedMetrics,
  advisoryMetrics,
  missingFiles,
  missingAdvisoryFiles,
};

mkdirSync("coverage", { recursive: true });
writeFileSync(
  "coverage/unit-coverage-summary.json",
  JSON.stringify(summary, null, 2) + "\n",
  "utf8"
);

const average = trackedMetrics.reduce(
  (acc, metric) => {
    acc.linePct += metric.linePct;
    acc.branchPct += metric.branchPct;
    acc.funcPct += metric.funcPct;
    return acc;
  },
  { linePct: 0, branchPct: 0, funcPct: 0 }
);

if (trackedMetrics.length > 0) {
  average.linePct /= trackedMetrics.length;
  average.branchPct /= trackedMetrics.length;
  average.funcPct /= trackedMetrics.length;
}

let reportText = "Unit Coverage (Tracked Files)\n";
reportText += `Thresholds -> lines: ${lineThreshold}%, branches: ${branchThreshold}%, functions: ${funcThreshold}%\n`;
for (const metric of trackedMetrics) {
  reportText += `- ${metric.file}: lines=${metric.linePct.toFixed(2)} branches=${metric.branchPct.toFixed(2)} funcs=${metric.funcPct.toFixed(2)}\n`;
}
reportText += `Average: lines=${average.linePct.toFixed(2)} branches=${average.branchPct.toFixed(2)} funcs=${average.funcPct.toFixed(2)}\n`;
if (missingFiles.length > 0) {
  reportText += `Missing from coverage report: ${missingFiles.join(", ")}\n`;
}
if (advisoryMetrics.length > 0 && !quiet) {
  reportText += "Advisory Coverage (non-gating)\n";
  for (const metric of advisoryMetrics) {
    reportText += `- ${metric.file}: lines=${metric.linePct.toFixed(2)} branches=${metric.branchPct.toFixed(2)} funcs=${metric.funcPct.toFixed(2)}\n`;
  }
}
if (missingAdvisoryFiles.length > 0 && !quiet) {
  reportText += `Missing advisory files from coverage report: ${missingAdvisoryFiles.join(", ")}\n`;
}

writeFileSync("coverage/unit-coverage-summary.txt", reportText, "utf8");
console.log(reportText.trimEnd());

if (!enforce) {
  process.exit(0);
}

const failures = [];
for (const metric of trackedMetrics) {
  if (metric.linePct < lineThreshold) {
    failures.push(`${metric.file}: line coverage ${metric.linePct}% < ${lineThreshold}%`);
  }
  if (metric.branchPct < branchThreshold) {
    failures.push(
      `${metric.file}: branch coverage ${metric.branchPct}% < ${branchThreshold}%`
    );
  }
  if (metric.funcPct < funcThreshold) {
    failures.push(`${metric.file}: function coverage ${metric.funcPct}% < ${funcThreshold}%`);
  }
}

for (const missingFile of missingFiles) {
  failures.push(`${missingFile}: no coverage metrics found`);
}

if (failures.length > 0) {
  console.error("\nCoverage compliance failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

if (quiet) {
  console.log("Unit coverage compliance: PASS");
}
