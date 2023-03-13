import { AccountDetails } from "types";
import BN from "bn.js";
import { StorageFees } from "./configParse18";

export function calculateAmountForDelta(
  config18: StorageFees,
  timeDeltaSec: number,
  isMasterchain: boolean,
  accountDetails: AccountDetails
) {
  const cell_price_ps = isMasterchain
    ? config18.mc_cell_price_ps
    : config18.cell_price_ps;
  const bit_price_ps = isMasterchain
    ? config18.mc_bit_price_ps
    : config18.bit_price_ps;

  return new BN(
    (timeDeltaSec *
      (accountDetails.storageStat!.used.cells * cell_price_ps +
        accountDetails.storageStat!.used.bits * bit_price_ps)) /
      2 ** 16
  ).add(new BN(accountDetails.storageStat?.duePayment ?? 0));
}
