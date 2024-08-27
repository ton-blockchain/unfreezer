import { useQuery } from "@tanstack/react-query";
import { Address, Cell, StateInit } from "ton";
import { useNotification } from "../components";
import { executeV4Function } from "./getClientV4";
import { size } from "lodash";

// https://github.com/ton-blockchain/ton/blob/master/crypto/block/mc-config.h#L391
const maxSizeBits = 1 << 21;

export function useUnfreezeTxn(
  accountStr: string,
  stateInitHashToMatch: string | null,
  unfreezeBlock?: number
) {
  const { showNotification } = useNotification();

  return useQuery(
    ["unfreeze", accountStr, unfreezeBlock],
    async () => {
      const account = Address.parse(accountStr);

      let error;

      const { account: accountDetails } = await executeV4Function((tc4) =>
        tc4.getAccount(unfreezeBlock!, account)
      );

      if (accountDetails.state.type !== "active") {
        return {
          error: "Account isn't active at specified block",
        };
      }

      const stateInit = new StateInit({
        code: Cell.fromBoc(
          Buffer.from(accountDetails.state.code!, "base64")
        )[0],
        data: Cell.fromBoc(
          Buffer.from(accountDetails.state.data!, "base64")
        )[0],
      });

      const c = new Cell();
      stateInit.writeTo(c);
      const stateInitHash = c.hash().toString("base64");

      if (!!stateInitHashToMatch && stateInitHashToMatch !== stateInitHash) {
        error = `Expecting state init hash ${stateInitHashToMatch}, got ${stateInitHash}`;
      }

      const sizeBits = c.toBoc().byteLength * 8;
      if (sizeBits > maxSizeBits) {
        error = `State init is too big: ${sizeBits} bits, max is ${maxSizeBits}`;
      }

      return {
        stateInit: c.toBoc().toString("base64"),
        sizeBits: c.toBoc().byteLength * 8,
        stateInitHash,
        error,
      };
    },
    {
      onError: (error: any) =>
        showNotification({ variant: "error", message: error.toString() }),
      enabled: !!unfreezeBlock && !!accountStr,
    }
  );
}
