import type { Cell } from "@ton/core";

export type Network = "mainnet" | "testnet";

/** Reports human-readable progress; the UI shows it in a progress modal. */
export type ProgressCallback = (step: string, detail?: string) => void;

/** Reference to the transaction that froze the account (toncenter v3 ids). */
export interface FreezeTxRef {
  lt: string;
  hash: string;
}

export interface AccountDetails {
  balance: string;
  accountState: "active" | "frozen" | "uninit";
  isFrozen: boolean;
  /** frozen_hash of the account — the StateInit hash the unfreeze must reproduce. */
  stateInitHashToMatch: string | null;
  /** Masterchain seqno whose state holds the pre-freeze StateInit. */
  unfreezeBlock?: number;
  /** The freeze transaction; enables the emulation fallback. */
  freezeTx?: FreezeTxRef;
  /** Storage debt that must be covered to revive the account, in TON. */
  minAmountToSend?: string;
  /** Storage rent for one month at current prices, in TON. */
  pricePerMonth?: string;
}

export interface StateForUnfreeze {
  stateInitHash: string;
  stateInitBoc: string;
  stateInitCell: Cell;
  sizeBits: number;
  sizeBytes: number;
  error?: string;
}
