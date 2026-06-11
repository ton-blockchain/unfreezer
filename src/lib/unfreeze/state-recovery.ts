// Recover the pre-freeze StateInit: fast path reads the account state at the
// unfreeze block; the fallback replays in-block transactions in the emulator.

import { Address, Cell, beginCell, loadShardAccount, storeStateInit } from "@ton/core";
import type { Transaction as CoreTransaction } from "@ton/core";
import { getShardAccountCell, toncenterApiKey } from "./toncenter.ts";
import type { FreezeTxRef, Network, ProgressCallback, StateForUnfreeze } from "./types.ts";

/** Hard cap on the StateInit size carried by the unfreeze message. */
const MAX_STATE_INIT_BITS = 1 << 21;

// Recover the account state right before the freeze transaction by replaying
// its in-block predecessors in the TVM emulator (txtracer-core). Needed when
// that state never appears at a masterchain block boundary: the freeze tx
// shares a block with the previous account transaction.
async function recoverStateInitViaEmulation(
  address: Address,
  network: Network,
  freezeTx: FreezeTxRef,
): Promise<Cell | null> {
  // txtracer-core reads the key at module init; set it before the import.
  // In the browser this is skipped and its bundled default key is used.
  if (typeof process !== "undefined" && process.env) {
    process.env.TONCENTER_API_KEY = toncenterApiKey(network);
  }
  // Dynamic import keeps the ~9.5MB emulator out of the entry chunk: with
  // `--splitting` it lands in a lazily-loaded split chunk.
  const {
    findRawTxByHash,
    findShardBlockForTx,
    findFullBlockForSeqno,
    computeMinLt,
    findAllTransactionsBetween,
    getBlockConfig,
    collectUsedLibraries,
    prepareEmulator,
    emulatePreviousTransactions,
    shardAccountToBase64,
  } = await import("txtracer-core");

  const testnet = network === "testnet";
  const baseTx = { lt: BigInt(freezeTx.lt), hash: Buffer.from(freezeTx.hash, "base64"), address };

  const [tx] = await findRawTxByHash(testnet, baseTx);
  if (!tx) return null;
  const shardBlock = await findShardBlockForTx(testnet, tx);
  if (!shardBlock) return null;

  const mcSeqno = shardBlock.masterchain_block_ref.seqno;
  const fullBlock = await findFullBlockForSeqno(testnet, mcSeqno);
  const minLt = computeMinLt(tx.tx, address, fullBlock);
  const [target, ...prevTxsInBlock] = await findAllTransactionsBetween(testnet, baseTx, minLt);
  if (!target) return null;
  prevTxsInBlock.reverse(); // newest→oldest → oldest→newest

  // Account snapshot at the previous masterchain block. Deliberately not
  // txtracer's getBlockAccount: that one rebuilds the state from bare
  // code+data and would drop libraries/special from the StateInit.
  const shardAccountBefore = await getShardAccountCell(address.toString(), network, mcSeqno - 1);
  if (!shardAccountBefore.account) return null;

  const blockConfig = await getBlockConfig(testnet, fullBlock);
  const [libs] = await collectUsedLibraries(testnet, shardAccountBefore, tx.tx, []);
  const randSeed = Buffer.from(shardBlock.rand_seed, "base64");
  const { emulate, emulateTickTock } = await prepareEmulator(blockConfig, libs, randSeed);

  // The executor doesn't know about earlier transactions
  shardAccountBefore.lastTransactionLt = 0n;
  shardAccountBefore.lastTransactionHash = 0n;
  const balance = shardAccountBefore.account.storage.balance.coins;

  const emulateAny = (t: CoreTransaction, sa: string) =>
    t.description.type === "tick-tock"
      ? emulateTickTock(t.description.isTock ? "tock" : "tick", t, sa)
      : emulate(t, sa);

  const { shardAccountBase64 } = await emulatePreviousTransactions(
    balance,
    prevTxsInBlock,
    emulateAny,
    shardAccountToBase64(shardAccountBefore),
  );

  const result = loadShardAccount(
    Cell.fromBoc(Buffer.from(shardAccountBase64, "base64"))[0]!.beginParse(),
  );
  const state = result.account?.storage.state;
  if (state?.type !== "active") return null;
  return beginCell().store(storeStateInit(state.state)).endCell();
}

export interface GetStateForUnfreezeOptions {
  address: string;
  network: Network;
  /** Masterchain seqno holding the pre-freeze state (AccountDetails.unfreezeBlock). */
  unfreezeBlock: number;
  /** frozen_hash to verify against (AccountDetails.stateInitHashToMatch). */
  stateInitHashToMatch?: string | null;
  /** Freeze transaction ref; enables the emulation fallback (AccountDetails.freezeTx). */
  freezeTx?: FreezeTxRef;
  onProgress?: ProgressCallback;
}

export async function getStateForUnfreeze(
  options: GetStateForUnfreezeOptions,
): Promise<StateForUnfreeze> {
  const { network, unfreezeBlock, stateInitHashToMatch, freezeTx, onProgress } = options;

  onProgress?.("Building StateInit", `Fetching state at block ${unfreezeBlock}`);
  const address = Address.parse(options.address);
  const shardAccount = await getShardAccountCell(address.toString(), network, unfreezeBlock);
  const state = shardAccount.account?.storage.state;

  // Serialize the complete StateInit: frozen_hash covers split_depth, special
  // and libraries too, so rebuilding from bare code+data would not match for
  // accounts that use them.
  let stateInitCell = state?.type === "active"
    ? beginCell().store(storeStateInit(state.state)).endCell()
    : null;

  // Fast path can miss when the pre-freeze state never existed at a
  // masterchain block boundary — replay the in-block transactions instead.
  const fastPathOk = stateInitCell !== null &&
    (!stateInitHashToMatch || stateInitCell.hash().toString("base64") === stateInitHashToMatch);

  if (!fastPathOk && freezeTx) {
    onProgress?.("Building StateInit", "Replaying in-block transactions in emulator");
    try {
      const recovered = await recoverStateInitViaEmulation(address, network, freezeTx);
      if (recovered) stateInitCell = recovered;
    } catch (e) {
      console.error("Emulation fallback failed:", e);
    }
  }

  if (!stateInitCell) {
    return {
      stateInitHash: "",
      stateInitBoc: "",
      stateInitCell: Cell.EMPTY,
      sizeBits: 0,
      sizeBytes: 0,
      error: "Account isn't active at specified block",
    };
  }

  const stateInitHash = stateInitCell.hash().toString("base64");
  const bocBytes = stateInitCell.toBoc();
  const sizeBytes = bocBytes.byteLength;
  const sizeBits = sizeBytes * 8;

  let error: string | undefined;

  if (stateInitHashToMatch && stateInitHashToMatch !== stateInitHash) {
    error = `Hash mismatch: expected ${stateInitHashToMatch}, got ${stateInitHash}`;
  }

  if (sizeBits > MAX_STATE_INIT_BITS) {
    error = `State init too big: ${sizeBits} bits, max ${MAX_STATE_INIT_BITS}`;
  }

  return {
    stateInitHash,
    stateInitBoc: bocBytes.toString("base64"),
    stateInitCell,
    sizeBits,
    sizeBytes,
    error,
  };
}
