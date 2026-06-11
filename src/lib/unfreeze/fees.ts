// Storage fee math: config param 18 parsing and rent/debt calculation.

import { Dictionary } from "@ton/core";
import type { Cell, DictionaryValue, Slice } from "@ton/core";
import { getConfigParamCell } from "./toncenter.ts";
import type { Network } from "./types.ts";

export const MONTH_SEC = 24 * 3600 * 30;

/** Storage prices from config param 18 (per second, 16-bit fixed point). */
export interface StorageFees {
  bit_price_ps: number;
  cell_price_ps: number;
  mc_bit_price_ps: number;
  mc_cell_price_ps: number;
}

const storagePricesValue: DictionaryValue<StorageFees> = {
  parse: (src: Slice): StorageFees => {
    const header = src.loadUint(8);
    if (header !== 0xcc) throw new Error("Invalid config 18 header");
    src.loadUintBig(32); // utime_since
    const bit_price_ps = Number(src.loadUintBig(64));
    const cell_price_ps = Number(src.loadUintBig(64));
    const mc_bit_price_ps = Number(src.loadUintBig(64));
    const mc_cell_price_ps = Number(src.loadUintBig(64));
    return { bit_price_ps, cell_price_ps, mc_bit_price_ps, mc_cell_price_ps };
  },
  serialize: () => {
    throw new Error("not implemented");
  },
};

/** Parses config 18 and returns the latest (highest utime_since) price entry. */
export function parseConfig18(slice: Slice): StorageFees {
  const dict = Dictionary.loadDirect(Dictionary.Keys.Uint(32), storagePricesValue, slice);
  let latest: StorageFees | undefined;
  for (const [, value] of dict) {
    latest = value;
  }
  if (!latest) throw new Error("Empty config 18");
  return latest;
}

/** Current storage prices fetched from the blockchain config. */
export async function getConfig18(network: Network): Promise<StorageFees> {
  const cell = await getConfigParamCell(network, 18);
  return parseConfig18(cell.beginParse());
}

/** Storage fee in nanotons for keeping the given cells/bits over `timeDeltaSec`. */
export function calculateStorageFee(
  config18: StorageFees,
  timeDeltaSec: number,
  isMasterchain: boolean,
  cellCount: number,
  bitCount: number,
): bigint {
  const cell_price_ps = isMasterchain ? config18.mc_cell_price_ps : config18.cell_price_ps;
  const bit_price_ps = isMasterchain ? config18.mc_bit_price_ps : config18.bit_price_ps;
  return BigInt(
    Math.ceil((timeDeltaSec * (cellCount * cell_price_ps + bitCount * bit_price_ps)) / 2 ** 16),
  );
}

/** Total cell and bit counts of a cell tree (refs counted per occurrence). */
export function countCellStats(cell: Cell): { cells: number; bits: number } {
  let cells = 1;
  let bits = cell.bits.length;
  for (const ref of cell.refs) {
    const sub = countCellStats(ref);
    cells += sub.cells;
    bits += sub.bits;
  }
  return { cells, bits };
}
