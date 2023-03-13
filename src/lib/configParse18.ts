import { Slice } from "ton";

export type StorageFees = {
  utime_since: number;
  bit_price_ps: number;
  cell_price_ps: number;
  mc_bit_price_ps: number;
  mc_cell_price_ps: number;
};

export function configParse18(slice: Slice | null | undefined): StorageFees {
  console.log(slice);
  if (!slice) {
    throw Error("Invalid config");
  }

  const result = slice.readDict(32, (slice) => {
    let header = slice.readUintNumber(8);
    if (header !== 0xcc) {
      throw Error("Invalid config");
    }
    let utime_since = slice.readUint(32).toNumber();
    let bit_price_ps = slice.readUint(64).toNumber();
    let cell_price_ps = slice.readUint(64).toNumber();
    let mc_bit_price_ps = slice.readUint(64).toNumber();
    let mc_cell_price_ps = slice.readUint(64).toNumber();
    return {
      utime_since,
      bit_price_ps,
      cell_price_ps,
      mc_bit_price_ps,
      mc_cell_price_ps,
    };
  });

  return result.get("0")!;
}
