// Builds a throwaway Git repository (baseline + example change) and runs PolicyGuard on it.
// Usage: pnpm build && node examples/demo/run-demo.mjs [vulnerable-service|compliant-service]
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const cli = path.join(root, "dist", "cli", "index.js");
const example = process.argv[2] ?? "vulnerable-service";

const git = (cwd, ...args) =>
  execFileSync("git", args, {
    cwd,
    stdio: "pipe",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Demo",
      GIT_AUTHOR_EMAIL: "demo@example.invalid",
      GIT_COMMITTER_NAME: "Demo",
      GIT_COMMITTER_EMAIL: "demo@example.invalid",
    },
  });
const policyguard = (cwd, ...args) =>
  spawnSync(process.execPath, [cli, ...args], { cwd, stdio: "inherit" });

const dir = mkdtempSync(path.join(tmpdir(), "policyguard-demo-"));
try {
  git(dir, "init", "-q", "-b", "main");
  cpSync(path.join(root, "fixtures", "sample-typescript-service"), dir, { recursive: true });
  policyguard(dir, "init");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "baseline");
  git(dir, "checkout", "-q", "-b", "feature");

  for (const entry of readdirSync(dir)) {
    if (entry !== ".git" && entry !== ".policyguard") rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
  cpSync(path.join(root, "examples", example), dir, { recursive: true });
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "feature change");

  console.log(`\n$ policyguard review --base main   (example: ${example}, repo: ${dir})\n`);
  const result = policyguard(dir, "review", "--base", "main");
  process.exitCode = result.status ?? 2;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
