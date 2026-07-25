// =============================================================================
// Gate: automated a11y scan of the built active-demo routes (IBM equal-access).
//
//   npm run test:a11y
//
// Uses accessibility-checker (Apache-2.0). Do NOT substitute pa11y (LGPL-3.0) or
// a direct axe-core dependency (MPL-2.0) — see docs/dependency-policy.md posture
// and ~/.maxwell/engine-value-research.md R1/R2.
//
// Honesty: automated scanning catches roughly a third of WCAG issues. This gate
// is a floor. Never state that a site is accessible.
//
// Flow: ensure `next build`, start `next start` on a free port, scan demo routes
// with policy WCAG_2_2, fail on violation-level findings, shut down.
// =============================================================================

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const require = createRequire(import.meta.url);

/** Active elevator-demo routes worth scanning (nav + contact intake). */
const ROUTES = ["/", "/about", "/contact", "/request", "/careers"];

function freePort() {
  return new Promise((resolvePort, reject) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      s.close((err) => (err ? reject(err) : resolvePort(port)));
    });
    s.on("error", reject);
  });
}

function killTree(child) {
  if (!child?.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try {
      process.kill(child.pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...opts.env },
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not become ready at ${url}`);
}

async function ensureBuild() {
  if (process.env.A11Y_SKIP_BUILD === "1" && existsSync(resolve(root, ".next"))) {
    console.log("A11Y_SKIP_BUILD=1 and .next present; reusing existing build");
    return;
  }
  console.log("Building active demo for a11y scan…");
  await run("npm", ["run", "build"]);
}

async function main() {
  await ensureBuild();

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  console.log(`Starting next start on ${base}`);
  const server = spawn("npx", ["next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    env: { ...process.env },
  });
  let serverLog = "";
  server.stdout.on("data", (d) => {
    serverLog += d.toString();
  });
  server.stderr.on("data", (d) => {
    serverLog += d.toString();
  });

  const aChecker = require("accessibility-checker");
  /** @type {{ route: string, report: any }[]} */
  const failures = [];
  /** @type {string[]} */
  const passed = [];

  try {
    await waitForServer(base);
    for (const route of ROUTES) {
      const url = base + route;
      const label = "demo" + (route === "/" ? "/home" : route);
      console.log(`\nScanning ${url} (WCAG_2_2)…`);
      const { report } = await aChecker.getCompliance(url, label);
      const code = aChecker.assertCompliance(report);
      const counts = report?.summary?.counts || {};
      console.log(
        `  violations=${counts.violation ?? 0} potentialviolation=${counts.potentialviolation ?? 0} ` +
          `assertCompliance=${code}`,
      );
      if (code === 0) {
        passed.push(route);
      } else {
        failures.push({ route, report });
        console.log(aChecker.stringifyResults(report));
      }
    }
  } finally {
    try {
      await aChecker.close();
    } catch {
      // ignore close errors
    }
    killTree(server);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n# a11y gate summary");
  console.log(`Scanned ${ROUTES.length} built demo route(s) with IBM accessibility-checker`);
  console.log(`policy=WCAG_2_2 failLevels=violation`);
  console.log(`passed: ${passed.join(", ") || "(none)"}`);
  if (failures.length) {
    console.error(
      `\nFAIL: ${failures.length} route(s) had WCAG 2.2 AA violation-level findings: ` +
        failures.map((f) => f.route).join(", "),
    );
    console.error(
      "Automated scanning catches roughly a third of WCAG issues; fix the violations above.",
    );
    if (serverLog && process.env.A11Y_DEBUG) console.error(serverLog);
    process.exit(1);
  }
  console.log("All scanned routes passed the violation-level WCAG 2.2 AA gate.");
  console.log(
    "Note: this is not a claim that the site is accessible — only that these routes " +
      "had no violation-level findings under the IBM WCAG_2_2 rule set.",
  );
  // Puppeteer / chromedriver keep the event loop alive after aChecker.close();
  // force a clean CI exit once the gate has decided.
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
