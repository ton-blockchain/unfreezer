import { useQuery } from "@tanstack/react-query";
import { Address, fromNano, Cell } from "ton";
import { useNotification } from "../components";
import { configParse18 } from "./configParse18";
import { calculateAmountForDelta } from "./calculateAmountForDelta";
import { findUnfreezeBlock } from "./findUnfreezeBlock";
import { MONTH_SEC } from "./useUnfreezeCallback";
import { executeV4Function, getClientsV4 } from "./getClientV4";

export async function accountAtBlock(account: Address, block: number) {
  // Fetch current account details (under the assumption it's frozen)
  const { account: frozenAccountDetails } = await executeV4Function((tc4) =>
    tc4.getAccount(block, account)
  );

  return frozenAccountDetails;
}

export async function accountAtLatestBlock(account: Address) {
  const seqno = await latestBlock();

  return [await accountAtBlock(account, seqno), seqno] as const;
}

export async function latestBlock() {
  const {
    last: { seqno },
  } = await executeV4Function((tc4) => tc4.getLastBlock());
  return seqno;
}

export function useAccountDetails(
  addressStr: string,
  overrideBlockToReviveFrom?: number
) {
  const { showNotification } = useNotification();
  const query = useQuery(
    ["account_details", addressStr, overrideBlockToReviveFrom],
    async () => {
      const address = Address.parse(addressStr);
      const [initialAccount, latestBlock] = await accountAtLatestBlock(address);

      const balance = fromNano(initialAccount.balance.coins);

      // Fetch config param 18 which specifies storage prices / sec
      const config18Raw = await executeV4Function((tc4) =>
        tc4.getConfig(latestBlock, [18])
      );
      const config18 = configParse18(
        Cell.fromBoc(
          Buffer.from(config18Raw.config.cell, "base64")
        )[0].beginParse()
      );

      // Account not frozen, so we return
      if (initialAccount.state.type === "active") {
        return {
          accountState: initialAccount.state.type,
          isFrozen: false,
          balance,
          stateInitHashToMatch: null,
          pricePerMonth: fromNano(
            calculateAmountForDelta(
              config18,
              MONTH_SEC,
              address.workChain === -1,
              initialAccount
            )
          ),
        };
      }

      let unfreezeBlock, lastPaid, activeAccountDetails;

      try {
        // Fetch the block number to unfreeze from
        ({ unfreezeBlock, lastPaid, activeAccountDetails } =
          await findUnfreezeBlock(address, overrideBlockToReviveFrom));
      } catch (e: any) {
        console.warn("Unable to find unfreeze block: " + e.toString());
      }

      return {
        accountState: initialAccount.state.type,
        isFrozen: true,
        unfreezeBlock,
        balance,
        stateInitHashToMatch:
          initialAccount.state.type === "uninit"
            ? null
            : initialAccount.state.stateHash,
        workchain: address.workChain,
        minAmountToSend: lastPaid
          ? fromNano(
              calculateAmountForDelta(
                config18,
                Date.now() / 1000 - lastPaid,
                address.workChain === -1,
                initialAccount
              )
            )
          : undefined,
        pricePerMonth: activeAccountDetails
          ? fromNano(
              calculateAmountForDelta(
                config18,
                MONTH_SEC,
                address.workChain === -1,
                initialAccount
              )
            )
          : undefined,
      };
    },
    {
      onError: (error: any) =>
        showNotification({ variant: "error", message: error.toString() }),
      enabled: !!addressStr,
    }
  );

  return { ...query, isLoading: query.isLoading && !query.isPaused };
}
