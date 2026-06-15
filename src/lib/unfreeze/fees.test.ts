// Pure-logic tests for the fee math (config 18 parsing, storage fee, cell
// stats). Network-dependent paths are covered by the CSV batch test:
//   TONCENTER_API_KEY=... bun src/lib/unfreeze-csv-test.ts

import { describe, expect, test } from "bun:test";
import { Dictionary, beginCell } from "@ton/core";
import type { DictionaryValue } from "@ton/core";
import { calculateStorageFee, countCellStats, parseConfig18 } from "./fees.ts";
import type { StorageFees } from "./fees.ts";

// Serializer mirroring StoragePrices (tag 0xcc) for building test fixtures.
interface StoragePricesEntry extends StorageFees {
  utime_since: number;
}

const storagePricesFixture: DictionaryValue<StoragePricesEntry> = {
  serialize: (src, builder) => {
    builder
      .storeUint(0xcc, 8)
      .storeUint(src.utime_since, 32)
      .storeUint(src.bit_price_ps, 64)
      .storeUint(src.cell_price_ps, 64)
      .storeUint(src.mc_bit_price_ps, 64)
      .storeUint(src.mc_cell_price_ps, 64);
  },
  parse: () => {
    throw new Error("not needed");
  },
};

// Current mainnet values for reference.
const MAINNET_PRICES: StorageFees = {
  bit_price_ps: 1,
  cell_price_ps: 500,
  mc_bit_price_ps: 1000,
  mc_cell_price_ps: 500000,
};

describe("parseConfig18", () => {
  test("parses a single entry", () => {
    const dict = Dictionary.empty(Dictionary.Keys.Uint(32), storagePricesFixture);
    dict.set(0, { utime_since: 0, ...MAINNET_PRICES });
    const cell = beginCell().storeDictDirect(dict).endCell();

    expect(parseConfig18(cell.beginParse())).toEqual(MAINNET_PRICES);
  });

  test("returns the latest (highest utime_since) entry", () => {
    const dict = Dictionary.empty(Dictionary.Keys.Uint(32), storagePricesFixture);
    dict.set(0, { utime_since: 0, ...MAINNET_PRICES });
    dict.set(1700000000, {
      utime_since: 1700000000,
      bit_price_ps: 2,
      cell_price_ps: 1000,
      mc_bit_price_ps: 2000,
      mc_cell_price_ps: 1000000,
    });
    const cell = beginCell().storeDictDirect(dict).endCell();

    expect(parseConfig18(cell.beginParse())).toEqual({
      bit_price_ps: 2,
      cell_price_ps: 1000,
      mc_bit_price_ps: 2000,
      mc_cell_price_ps: 1000000,
    });
  });

  test("rejects an invalid entry header", () => {
    const badEntry: DictionaryValue<null> = {
      serialize: (_src, builder) => {
        builder.storeUint(0xab, 8).storeUint(0, 32);
        for (let i = 0; i < 4; i++) builder.storeUint(0, 64);
      },
      parse: () => null,
    };
    const dict = Dictionary.empty(Dictionary.Keys.Uint(32), badEntry);
    dict.set(0, null);
    const cell = beginCell().storeDictDirect(dict).endCell();

    expect(() => parseConfig18(cell.beginParse())).toThrow("Invalid config 18 header");
  });
});

describe("calculateStorageFee", () => {
  test("uses basechain prices off masterchain", () => {
    // 2^16 seconds cancels the fixed-point divisor exactly.
    const fee = calculateStorageFee(MAINNET_PRICES, 65536, false, 1, 0);
    expect(fee).toBe(500n);
  });

  test("uses masterchain prices on masterchain", () => {
    const fee = calculateStorageFee(MAINNET_PRICES, 65536, true, 1, 0);
    expect(fee).toBe(500000n);
  });

  test("combines cell and bit prices", () => {
    const fee = calculateStorageFee(MAINNET_PRICES, 65536, false, 3, 1000);
    expect(fee).toBe(BigInt(3 * 500 + 1000 * 1));
  });

  test("rounds fractional fees up", () => {
    // (1s * 501) / 65536 ≈ 0.0076 → 1 nanoton
    const fee = calculateStorageFee(MAINNET_PRICES, 1, false, 1, 1);
    expect(fee).toBe(1n);
  });

  test("zero usage costs nothing", () => {
    expect(calculateStorageFee(MAINNET_PRICES, 65536, false, 0, 0)).toBe(0n);
  });
});

describe("countCellStats", () => {
  test("counts a single cell", () => {
    const cell = beginCell().storeUint(0, 32).endCell();
    expect(countCellStats(cell)).toEqual({ cells: 1, bits: 32 });
  });

  test("counts nested refs", () => {
    const cell = beginCell()
      .storeUint(0, 32)
      .storeRef(beginCell().storeUint(0, 16).endCell())
      .storeRef(beginCell().storeRef(beginCell().endCell()).endCell())
      .endCell();
    expect(countCellStats(cell)).toEqual({ cells: 4, bits: 48 });
  });
});
