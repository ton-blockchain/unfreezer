// Find the unfreeze block via toncenter v3: binary search over tx time.
//
// Probe = the latest transaction at time ≤ T; it matches when it left the
// account frozen with the frozen_hash we are unfreezing. Checking the hash
// inside the predicate (it comes for free in the v3 response) makes earlier
// freeze cycles, uninit prefixes and spam transactions all land on the
// "before" side, so a single binary search pass finds a usable boundary:
// any transition into a matching-frozen state yields the right StateInit.

import { v3Transaction } from "./toncenter.ts";
import type { V3Transaction } from "./toncenter.ts";
import type { FreezeTxRef, Network, ProgressCallback } from "./types.ts";

export interface FreezeSearchResult {
  /** Masterchain seqno whose state holds the pre-freeze StateInit. */
  unfreezeBlock: number;
  /** The transaction that froze the account. */
  freezeTx: FreezeTxRef;
}

export async function findUnfreezeBlock(
  address: string,
  network: Network,
  frozenHash: string,
  onProgress?: ProgressCallback,
): Promise<FreezeSearchResult | null> {
  // Strict match for binary search probes. The indexer leaves frozen_hash
  // null on the freeze transaction itself (it's filled on later frozen→frozen
  // txs), so null must stay on the "before" side here — otherwise the search
  // could converge to an older freeze cycle.
  const isTarget = (tx: V3Transaction) =>
    tx.end_status === "frozen" && tx.account_state_after.frozen_hash === frozenHash;
  // Tolerant match for chain-derived transactions (bounds, walk-back result),
  // where null doesn't risk picking a wrong boundary: the final StateInit
  // hash verification still guards correctness.
  const isTargetOrNull = (tx: V3Transaction) =>
    tx.end_status === "frozen" &&
    (tx.account_state_after.frozen_hash === frozenHash || tx.account_state_after.frozen_hash === null);

  onProgress?.("Searching for freeze transaction", "Fetching transaction bounds");
  const first = await v3Transaction(network, { account: address, sort: "asc" });
  const last = await v3Transaction(network, { account: address, sort: "desc" });
  if (!first || !last || !isTargetOrNull(last)) return null;

  // Invariants: the latest tx at time lo is not a target; candidate is a
  // target tx at time hi.
  let lo = first.now - 1;
  let hi = last.now;
  let candidate = last;

  for (let step = 1; lo < hi - 1; step++) {
    if (step > 48) return null;
    onProgress?.("Searching for freeze transaction", `Binary search step ${step}`);

    const mid = Math.floor((lo + hi) / 2);
    const tx = await v3Transaction(network, { account: address, end_utime: mid, sort: "desc" });
    if (!tx) {
      lo = mid;
      continue;
    }
    if (isTarget(tx)) {
      candidate = tx;
      hi = tx.now;
      continue;
    }

    // The latest tx ≤ mid left a non-target state, so the boundary is after
    // it — and the very next transaction is often the freeze tx itself.
    const next = await v3Transaction(network, {
      account: address,
      start_lt: (BigInt(tx.lt) + 1n).toString(),
      sort: "asc",
    });
    if (!next) return null;
    if (isTarget(next)) {
      candidate = next;
      if (next.orig_status !== "frozen") break; // exact transition found
      hi = next.now;
      continue;
    }
    lo = Math.max(mid, next.now);
  }

  // candidate ends in the target frozen state; walk back through
  // frozen→frozen transactions (same-second ties, spam) to the transition.
  let freezeTx = candidate;
  for (let hops = 0; freezeTx.orig_status === "frozen"; hops++) {
    if (hops > 64) return null;
    onProgress?.("Searching for freeze transaction", "Walking back to the freeze transaction");
    const prevTx = await v3Transaction(network, { account: address, lt: freezeTx.prev_trans_lt });
    if (!prevTx) return null;
    freezeTx = prevTx;
  }

  if (!isTargetOrNull(freezeTx) || freezeTx.prev_trans_lt === "0") return null;

  // The state to restore is the one right after the previous transaction —
  // take its masterchain block.
  onProgress?.("Searching for freeze transaction", "Locating last active block");
  const prev = await v3Transaction(network, { account: address, lt: freezeTx.prev_trans_lt });
  if (!prev) return null;

  // If both landed in the same masterchain block, the state at that block is
  // already frozen — try the block before; hash verification decides, and the
  // emulation fallback in getStateForUnfreeze covers the mismatch case.
  const unfreezeBlock = prev.mc_block_seqno >= freezeTx.mc_block_seqno
    ? freezeTx.mc_block_seqno - 1
    : prev.mc_block_seqno;
  return { unfreezeBlock, freezeTx: { lt: freezeTx.lt, hash: freezeTx.hash } };
}
