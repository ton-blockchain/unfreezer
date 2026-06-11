// Fetch everything the UI needs about an account: state, storage debt,
// monthly rent and — for frozen accounts — the unfreeze block and freeze tx.

import { Address, Cell, fromNano } from "@ton/core";
import { calculateStorageFee, countCellStats, getConfig18, MONTH_SEC } from "./fees.ts";
import { findUnfreezeBlock } from "./freeze-search.ts";
import { getAccountInfo, getShardAccountCell } from "./toncenter.ts";
import type { AccountDetails, Network, ProgressCallback } from "./types.ts";

export async function fetchAccountDetails(
  addressStr: string,
  network: Network,
  onProgress?: ProgressCallback,
): Promise<AccountDetails> {
  const address = Address.parse(addressStr);
  const friendlyAddr = address.toString();

  onProgress?.("Fetching account state");
  const currentInfo = await getAccountInfo(friendlyAddr, network);
  const balance = fromNano(BigInt(currentInfo.balance));

  onProgress?.("Fetching storage config");
  const config18 = await getConfig18(network);

  const state = currentInfo.state === "active" ? "active"
    : currentInfo.state === "frozen" ? "frozen"
    : "uninit";

  if (state === "active") {
    let cellCount = 0, bitCount = 0;
    if (currentInfo.code) {
      const stats = countCellStats(Cell.fromBoc(Buffer.from(currentInfo.code, "base64"))[0]!);
      cellCount += stats.cells;
      bitCount += stats.bits;
    }
    if (currentInfo.data) {
      const stats = countCellStats(Cell.fromBoc(Buffer.from(currentInfo.data, "base64"))[0]!);
      cellCount += stats.cells;
      bitCount += stats.bits;
    }

    return {
      accountState: "active",
      isFrozen: false,
      balance,
      stateInitHashToMatch: null,
      pricePerMonth: fromNano(
        calculateStorageFee(config18, MONTH_SEC, address.workChain === -1, cellCount, bitCount),
      ),
    };
  }

  if (state === "uninit") {
    return { accountState: "uninit", isFrozen: false, balance, stateInitHashToMatch: null };
  }

  // ─── Frozen: parse ShardAccount for storage stats ───
  onProgress?.("Fetching ShardAccount cell");
  const shardAccount = await getShardAccountCell(friendlyAddr, network);

  if (!shardAccount.account) {
    return {
      accountState: "frozen",
      isFrozen: true,
      balance,
      stateInitHashToMatch: currentInfo.frozen_hash ?? null,
    };
  }

  const { lastPaid, duePayment, used } = shardAccount.account.storageStats;
  const cellCount = Number(used.cells);
  const bitCount = Number(used.bits);
  const isMasterchain = address.workChain === -1;

  // Find unfreeze block via v3 transaction-time binary search
  const found = currentInfo.frozen_hash
    ? await findUnfreezeBlock(friendlyAddr, network, currentInfo.frozen_hash, onProgress)
    : null;

  const timeSinceFreeze = Date.now() / 1000 - lastPaid;
  const storageFee = calculateStorageFee(config18, timeSinceFreeze, isMasterchain, cellCount, bitCount);
  const totalDebt = storageFee + (duePayment ?? 0n);

  return {
    accountState: "frozen",
    isFrozen: true,
    balance,
    stateInitHashToMatch: currentInfo.frozen_hash ?? null,
    unfreezeBlock: found?.unfreezeBlock,
    freezeTx: found?.freezeTx,
    minAmountToSend: fromNano(totalDebt),
    pricePerMonth: fromNano(
      calculateStorageFee(config18, MONTH_SEC, isMasterchain, cellCount, bitCount),
    ),
  };
}
