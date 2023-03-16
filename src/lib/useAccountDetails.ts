import { useQuery } from "@tanstack/react-query";
import { Address, fromNano, Cell } from "ton";
import { useNotification } from "../components";
import { configParse18 } from "./configParse18";
import { calculateAmountForDelta } from "./calculateAmountForDelta";
import { findUnfreezeBlock } from "./findUnfreezeBlock";
import { MONTH_SEC } from "./useUnfreezeCallback";
import { getClientV4 } from "./getClientV4";

export function useAccountDetails(
  accountStr: string,
  overrideBlockToReviveFrom?: number
) {
  const { showNotification } = useNotification();
  const query = useQuery(
    ["account_details", accountStr, overrideBlockToReviveFrom],
    async () => {
      const account = Address.parse(accountStr);

      const tc4 = await getClientV4();
      let {
        last: { seqno },
      } = await tc4.getLastBlock();

      // Fetch current account details (under the assumption it's frozen)
      const { account: frozenAccountDetails } = await tc4.getAccountLite(
        seqno,
        account
      );

      const balance = fromNano(frozenAccountDetails.balance.coins);

      // Fetch config param 18 which specifies storage prices / sec
      const config18Raw = await tc4.getConfig(seqno, [18]);
      const config18 = configParse18(
        Cell.fromBoc(
          Buffer.from(config18Raw.config.cell, "base64")
        )[0].beginParse()
      );

      // Account not frozen, so we return
      if (frozenAccountDetails.state.type === "active") {
        return {
          accountState: frozenAccountDetails.state.type,
          isFrozen: false,
          balance,
          pricePerMonth: fromNano(
            calculateAmountForDelta(
              config18,
              MONTH_SEC,
              account.workChain === -1,
              frozenAccountDetails
            )
          ),
        };
      } else {
        let unfreezeBlock, lastPaid, activeAccountDetails;

        try {
          // Fetch the block number to unfreeze from
          ({ unfreezeBlock, lastPaid, activeAccountDetails } =
            await findUnfreezeBlock(
              tc4,
              frozenAccountDetails,
              account,
              overrideBlockToReviveFrom
            ));
        } catch (e: any) {
          console.warn("Unable to find unfreeze block: " + e.toString());
        }

        return {
          accountState: frozenAccountDetails.state.type,
          isFrozen: true,
          unfreezeBlock,
          balance,
          stateInitHashToMatch:
            frozenAccountDetails.state.type === "uninit"
              ? null
              : frozenAccountDetails.state.stateHash,
          workchain: account.workChain,
          minAmountToSend: lastPaid
            ? fromNano(
                calculateAmountForDelta(
                  config18,
                  Date.now() / 1000 - lastPaid,
                  account.workChain === -1,
                  frozenAccountDetails
                )
              )
            : undefined,
          pricePerMonth: activeAccountDetails
            ? fromNano(
                calculateAmountForDelta(
                  config18,
                  MONTH_SEC,
                  account.workChain === -1,
                  activeAccountDetails
                )
              )
            : undefined,
        };
      }
    },
    {
      onError: (error: any) =>
        showNotification({ variant: "error", message: error.toString() }),
      enabled: !!accountStr,
    }
  );

  return { ...query, isLoading: query.isLoading && !query.isPaused };
}
