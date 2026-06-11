// Batch test over the full frozen-accounts list exported from Dune (frozen-accounts.csv).
// Usage:
//   bun src/lib/unfreeze-csv-test.ts            # all accounts
//   bun src/lib/unfreeze-csv-test.ts 50         # first 50
//   bun src/lib/unfreeze-csv-test.ts 50 100     # 50 accounts starting at offset 100
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { fetchAccountDetails, getStateForUnfreeze } from "./unfreeze/index.ts";

const CSV_PATH = join(dirname(fileURLToPath(import.meta.url)), "../../frozen-accounts.csv");

function loadAccounts(): string[] {
  const lines = readFileSync(CSV_PATH, "utf-8").trim().split("\n").slice(1);
  return lines.map((line) => line.split(",")[0]!.replace(/"/g, ""));
}

const CONCURRENCY = 8;

async function testAccount(addr: string, short: string): Promise<{ verdict: "pass" | "fail" | "notFrozen"; line: string; error?: string }> {
  try {
    const details = await fetchAccountDetails(addr, "mainnet");

    if (!details.isFrozen) {
      return { verdict: "notFrozen", line: `NOT FROZEN (${details.accountState})` };
    }

    if (!details.unfreezeBlock) {
      return { verdict: "fail", line: "FAIL - no unfreezeBlock", error: `${short}: no unfreezeBlock` };
    }

    const state = await getStateForUnfreeze({
      address: addr,
      network: "mainnet",
      unfreezeBlock: details.unfreezeBlock,
      stateInitHashToMatch: details.stateInitHashToMatch,
      freezeTx: details.freezeTx,
    });

    const hashOk = state.stateInitHash === details.stateInitHashToMatch;
    const sizeOk = !state.error?.includes("too big");
    const status = hashOk ? "HASH OK" : "HASH MISMATCH";
    const sizeInfo = sizeOk ? `${(state.sizeBytes / 1024).toFixed(1)}KB` : "TOO BIG";
    const line = `${status}, ${sizeInfo}, block=${details.unfreezeBlock}${state.error ? ` [${state.error}]` : ""}`;

    if (hashOk) return { verdict: "pass", line };
    return { verdict: "fail", line, error: `${short}: hash mismatch (expected ${details.stateInitHashToMatch}, got ${state.stateInitHash})` };
  } catch (e: any) {
    return { verdict: "fail", line: `ERROR: ${e.message}`, error: `${short}: ${e.message}` };
  }
}

async function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : Infinity;
  const offset = process.argv[3] ? parseInt(process.argv[3], 10) : 0;
  const accounts = loadAccounts().slice(offset, offset + limit);

  let pass = 0, fail = 0, notFrozen = 0, done = 0;
  const errors: string[] = [];

  console.log(`Testing ${accounts.length} accounts (offset=${offset}, concurrency=${CONCURRENCY})\n`);
  const t0 = Date.now();

  let next = 0;
  async function worker() {
    while (next < accounts.length) {
      const i = next++;
      const addr = accounts[i]!;
      const short = `${addr.slice(0, 5)}...${addr.slice(-4)}`;
      const r = await testAccount(addr, short);
      done++;
      console.log(`[${done}/${accounts.length}] ${short}: ${r.line}`);
      if (r.verdict === "pass") pass++;
      else if (r.verdict === "notFrozen") notFrozen++;
      else { fail++; if (r.error) errors.push(r.error); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail, ${notFrozen} not frozen, ${accounts.length} total (${((Date.now() - t0) / 1000).toFixed(0)}s) ===`);
  if (errors.length) {
    console.log("\nFailures:");
    errors.forEach((e) => console.log(`  - ${e}`));
  }
}

main().catch(console.error);
