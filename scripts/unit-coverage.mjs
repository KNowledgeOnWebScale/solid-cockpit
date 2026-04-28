import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const enforce = args.has("--enforce");
const quiet = args.has("--quiet");

const lineThreshold = Number(process.env.UNIT_COVERAGE_LINES ?? "98");
const branchThreshold = Number(process.env.UNIT_COVERAGE_BRANCHES ?? "90");
const funcThreshold = Number(process.env.UNIT_COVERAGE_FUNCS ?? "100");

const trackedFiles = [
  "src/services/solid/fileUploadUtils.ts",
  "src/services/solid/mime_types.js",
  "src/services/query/queryPodUtils.ts",
  "src/services/query/z3-headers.ts",
];
const advisoryFiles = [
  "src/services/solid/login.ts",
  "src/services/solid/getData.ts",
  "src/services/solid/privacyEdit.ts",
];
const supportsCoverageInclude = process.allowedNodeEnvironmentFlags.has(
  "--test-coverage-include"
);
const coverageIncludeArgs = supportsCoverageInclude
  ? [...new Set([...trackedFiles, ...advisoryFiles])].map(
      (file) => `--test-coverage-include=${file}`
    )
  : [];

const testFiles = readdirSync("tests/unit")
  .filter((fileName) => fileName.endsWith(".test.ts"))
  .sort()
  .map((fileName) => `./tests/unit/${fileName}`);

// Ensure coverage outputs can always be written, including retry reporter files in CI.
mkdirSync("coverage", { recursive: true });

function runCoverageAttempt({
  label,
  extraArgs = [],
}) {
  const args = [
    "--test",
    "--experimental-test-coverage",
    ...coverageIncludeArgs,
    "--import",
    "./tests/register-ts-loader.mjs",
    ...extraArgs,
    ...testFiles,
  ];

  const result = spawnSync("node", args, { encoding: "utf8" });
  const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return {
    label,
    args,
    result,
    combinedOutput,
  };
}

const primaryAttempt = runCoverageAttempt({ label: "primary" });
let activeAttempt = primaryAttempt;

if (!quiet) {
  if (activeAttempt.result.stdout) process.stdout.write(activeAttempt.result.stdout);
  if (activeAttempt.result.stderr) process.stderr.write(activeAttempt.result.stderr);
}

if (activeAttempt.result.status !== 0) {
  if (quiet) {
    if (activeAttempt.result.stdout) process.stdout.write(activeAttempt.result.stdout);
    if (activeAttempt.result.stderr) process.stderr.write(activeAttempt.result.stderr);
  }
  process.exit(activeAttempt.result.status ?? 1);
}

const coverageRegex =
  /^(.+?)\s+\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*(.*)$/;

/**
 * Normalize file paths coming from coverage output so comparisons remain stable
 * across Node versions, CI runners, and OS path separators.
 */
function normalizeCoveragePath(filePath) {
  return filePath
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .trim();
}

/**
 * Remove ANSI escape sequences so coverage parsing is stable across terminals/CI.
 */
function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

/**
 * Resolve a tracked/advisory file to a parsed coverage metric.
 * Some Node versions emit absolute paths while others emit project-relative paths.
 */
function resolveMetricForFile(metricsByFile, filePath) {
  const normalizedTarget = normalizeCoveragePath(filePath);
  const directMetric = metricsByFile.get(normalizedTarget);
  if (directMetric) return directMetric;

  for (const [metricPath, metric] of metricsByFile.entries()) {
    const normalizedMetricPath = normalizeCoveragePath(metricPath);
    if (
      normalizedMetricPath === normalizedTarget ||
      normalizedMetricPath.endsWith(`/${normalizedTarget}`)
    ) {
      return metric;
    }
  }

  return null;
}

function parseMetricsFromCoverageOutput(rawCoverageOutput) {
  const metricsByFile = new Map();
  for (const line of stripAnsi(rawCoverageOutput).split("\n")) {
    const normalizedLine = line.replace(/^[#ℹ>\s]+/, "").trim();
    if (!normalizedLine) continue;
    if (normalizedLine.includes("start of coverage report")) continue;
    if (normalizedLine.includes("end of coverage report")) continue;
    if (
      normalizedLine.includes("file | line % | branch % | funcs %") ||
      normalizedLine.includes("File | % Stmts | % Branch | % Funcs | % Lines")
    ) {
      continue;
    }
    if (
      normalizedLine.startsWith("all files") ||
      normalizedLine.startsWith("All files") ||
      normalizedLine.startsWith("...files") ||
      normalizedLine.startsWith("…files")
    ) {
      continue;
    }
    if (/^-{3,}/.test(normalizedLine)) continue;

    const match = normalizedLine.match(coverageRegex);
    if (!match) continue;

    const [, file, linePct, branchPct, funcPct, uncovered] = match;
    const normalizedFile = normalizeCoveragePath(file);
    metricsByFile.set(normalizedFile, {
      file: normalizedFile,
      linePct: Number(linePct),
      branchPct: Number(branchPct),
      funcPct: Number(funcPct),
      uncovered: uncovered.trim(),
    });
  }
  return metricsByFile;
}

/**
 * Parse LCOV records into the same metric shape used by the text-coverage parser.
 * This is used as a resilient fallback when Node's text coverage table is empty in CI.
 */
function parseMetricsFromLcovFile(lcovPath) {
  const metricsByFile = new Map();
  if (!existsSync(lcovPath)) return metricsByFile;

  const content = readFileSync(lcovPath, "utf8");
  const records = content.split("end_of_record");
  for (const record of records) {
    const lines = record
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    const sourceLine = lines.find((line) => line.startsWith("SF:"));
    if (!sourceLine) continue;
    const sourceFile = normalizeCoveragePath(sourceLine.slice(3));

    let lf = 0;
    let lh = 0;
    let brf = 0;
    let brh = 0;
    let fnf = 0;
    let fnh = 0;

    for (const line of lines) {
      if (line.startsWith("LF:")) lf = Number(line.slice(3)) || 0;
      else if (line.startsWith("LH:")) lh = Number(line.slice(3)) || 0;
      else if (line.startsWith("BRF:")) brf = Number(line.slice(4)) || 0;
      else if (line.startsWith("BRH:")) brh = Number(line.slice(4)) || 0;
      else if (line.startsWith("FNF:")) fnf = Number(line.slice(4)) || 0;
      else if (line.startsWith("FNH:")) fnh = Number(line.slice(4)) || 0;
    }

    const pct = (hit, total) => (total > 0 ? (hit / total) * 100 : 100);
    metricsByFile.set(sourceFile, {
      file: sourceFile,
      linePct: pct(lh, lf),
      branchPct: pct(brh, brf),
      funcPct: pct(fnh, fnf),
      uncovered: "",
    });
  }

  return metricsByFile;
}

let metricsByFile = parseMetricsFromCoverageOutput(activeAttempt.combinedOutput);
const primaryMissing = trackedFiles.filter(
  (file) => !resolveMetricForFile(metricsByFile, file)
);

if (primaryMissing.length === trackedFiles.length) {
  const lcovPath = `${process.cwd()}/coverage/unit-retry.lcov`;
  if (existsSync(lcovPath)) unlinkSync(lcovPath);

  const retryAttempt = runCoverageAttempt({
    label: "retry-with-explicit-reporter",
    extraArgs: [
      "--test-reporter=tap",
      "--test-reporter-destination=stdout",
      "--test-reporter=lcov",
      `--test-reporter-destination=${lcovPath}`,
    ],
  });

  if (!quiet) {
    console.warn(
      "\nCoverage output from primary attempt did not include tracked files; retrying with explicit TAP+LCOV reporters."
    );
    if (retryAttempt.result.stdout) process.stdout.write(retryAttempt.result.stdout);
    if (retryAttempt.result.stderr) process.stderr.write(retryAttempt.result.stderr);
  }

  if (retryAttempt.result.status === 0) {
    activeAttempt = retryAttempt;
    metricsByFile = parseMetricsFromCoverageOutput(activeAttempt.combinedOutput);
    const retryMissing = trackedFiles.filter(
      (file) => !resolveMetricForFile(metricsByFile, file)
    );
    // If table output is still empty, fall back to LCOV metrics produced by retry reporter.
    if (retryMissing.length === trackedFiles.length) {
      metricsByFile = parseMetricsFromLcovFile(lcovPath);
    }
  } else if (quiet) {
    if (retryAttempt.result.stdout) process.stdout.write(retryAttempt.result.stdout);
    if (retryAttempt.result.stderr) process.stderr.write(retryAttempt.result.stderr);
  }
}

const trackedMetrics = trackedFiles
  .map((file) => resolveMetricForFile(metricsByFile, file))
  .filter(Boolean);
const missingFiles = trackedFiles.filter(
  (file) => !resolveMetricForFile(metricsByFile, file)
);
const advisoryMetrics = advisoryFiles
  .map((file) => resolveMetricForFile(metricsByFile, file))
  .filter(Boolean);
const missingAdvisoryFiles = advisoryFiles.filter(
  (file) => !resolveMetricForFile(metricsByFile, file)
);

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
  if (missingFiles.length === trackedFiles.length) {
    const debugPayload = {
      generatedAt: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      testFileCount: testFiles.length,
      trackedFiles,
      advisoryFiles,
      coverageIncludeArgs,
      retryLcovPath: `${process.cwd()}/coverage/unit-retry.lcov`,
      retryLcovExists: existsSync(`${process.cwd()}/coverage/unit-retry.lcov`),
      attempts: [
        {
          label: primaryAttempt.label,
          status: primaryAttempt.result.status,
          signal: primaryAttempt.result.signal,
          args: primaryAttempt.args,
      outputPreview: stripAnsi(primaryAttempt.combinedOutput).split("\n").slice(-120),
    },
    {
      label: activeAttempt.label,
      status: activeAttempt.result.status,
      signal: activeAttempt.result.signal,
      args: activeAttempt.args,
      outputPreview: stripAnsi(activeAttempt.combinedOutput).split("\n").slice(-120),
    },
  ],
      message:
        "Coverage parsing found no tracked files even after retry. This usually indicates a Node test-coverage reporter regression in CI runtime.",
    };
    writeFileSync(
      "coverage/unit-coverage-debug.json",
      JSON.stringify(debugPayload, null, 2) + "\n",
      "utf8"
    );
    console.error(
      "\nCoverage diagnostics were written to coverage/unit-coverage-debug.json"
    );
    console.error(
      `Node runtime: ${process.version} (${process.platform}-${process.arch}).`
    );
    console.error(
      "Suggestion: pin Node to a known-good patch and inspect the debug artifact from the failing CI run."
    );
  }
  console.error("\nCoverage compliance failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

if (quiet) {
  console.log("Unit coverage compliance: PASS");
}
