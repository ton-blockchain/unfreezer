import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Address, TonClient, TonClient4, fromNano, Cell, toNano } from "ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { StateInit } from "ton";
import { useNotification } from "components";
import { handleMobileLink, waitForSeqno } from "utils";
import { TX_SUBMIT_SUCCESS_TEXT } from "config";
import { useState } from "react";
import { AccountDetails } from "types";
import { useConnectionStore } from "store";

export async function getClientV2() {
  const endpoint = await getHttpEndpoint();
  return new TonClient({ endpoint });
}

export async function getClientV4() {
  // TODO clientV4 ton access dont work
  // const endpoint = await getHttpV4Endpoint();
  return new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
}

async function findUnfreezeBlock(
  tc4: TonClient4,
  lastKnownAccountDetails: AccountDetails,
  account: Address
): Promise<number> {
  const { shards: shardLastPaid } = await tc4.getBlockByUtime(
    lastKnownAccountDetails.storageStat!.lastPaid
  );

  const nextSeqno =
    shardLastPaid.find((s) => s.workchain === account.workChain)!.seqno - 1;

  const { account: accountDetails } = await tc4.getAccount(nextSeqno, account);

  if (accountDetails.state.type === "frozen") {
    return findUnfreezeBlock(tc4, accountDetails, account);
  } else if (accountDetails.state.type === "uninit") {
    throw new Error(
      "Reached uninint block at seqno: " +
        nextSeqno +
        ". Unable to detect active seqno."
    );
  }

  return nextSeqno;
}

export function useAccountDetails(accountStr: string) {
  const { showNotification } = useNotification();
  const query = useQuery(
    ["account_details", accountStr],
    async () => {
      const account = Address.parse(accountStr);

      const tc4 = await getClientV4();

      // TODO seqno per chain? (masterchain vs basic workchain)
      const {
        last: { seqno },
      } = await tc4.getLastBlock();

      const { account: accountDetails } = await tc4.getAccountLite(
        seqno,
        account
      );

      const balance = fromNano(accountDetails.balance.coins);

      if (accountDetails.state.type !== "frozen") {
        return {
          accountState: accountDetails.state.type,
          isFrozen: false,
          balance,
        };
      }

      const unfreezeBlock = await findUnfreezeBlock(
        tc4,
        accountDetails,
        account
      );

      return {
        accountState: accountDetails.state.type,
        isFrozen: true,
        unfreezeBlock,
        balance,
        stateInitHashToMatch: accountDetails.state.stateHash,
        workchain: account.workChain,
      };
    },
    {
      onError: (error: any) =>
        showNotification({ variant: "error", message: error.toString() }),
      enabled: !!accountStr,
    }
  );

  return { ...query, isLoading: query.isLoading && !query.isPaused };
}

export function useUnfreezeTxn(
  accountStr: string,
  stateInitHashToMatch?: string,
  unfreezeBlock?: number
) {
  const { showNotification } = useNotification();

  return useQuery(
    ["unfreeze", accountStr, unfreezeBlock],
    async () => {
      const account = Address.parse(accountStr);

      const tc4 = await getClientV4();
      let error

      const { account: accountDetails } = await tc4.getAccount(
        unfreezeBlock!,
        account
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

      if (stateInitHashToMatch !== stateInitHash) {
       error = `Expecting state init hash ${stateInitHashToMatch}, got ${stateInitHash}`;
      }

      return {
        stateInit: c.toBoc().toString("base64"),
        stateInitHash,
        error
      };
    },
    {
      onError: (error: any) =>
        showNotification({ variant: "error", message: error.toString() }),
      enabled: !!unfreezeBlock && !!stateInitHashToMatch && !!accountStr,
    }
  );
}

type UnfreezeArgs = {
  stateInit: string;
  address: string;
  amount?: number;
};

export const useUnfreezeCallback = () => {
  const { address: connectedWalletAddress, connectorTC } = useConnectionStore();
  const [txLoading, setTxLoading] = useState(false);
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const query = useMutation(
    async (args: UnfreezeArgs) => {
      if (!args.amount) {
        showNotification({
          variant: "error",
          message: "Missing TON amount",
        });
        return;
      }

      setTxLoading(true);
       showNotification({
         variant: "info",
         message: "Check your wallet for a pending transaction",
       });

      const clientV2 = await getClientV2();
      const waiter = await waitForSeqno(
        clientV2!.openWalletFromAddress({
          source: Address.parse(connectedWalletAddress!),
        })
      );

      const onSuccess = async () => {
        await waiter();
        setTxLoading(false);
        showNotification({
          variant: "success",
          message: TX_SUBMIT_SUCCESS_TEXT,
        });

        queryClient.invalidateQueries(["account_details"]);
      };
      handleMobileLink(connectorTC);

      await connectorTC.sendTransaction({
        validUntil: Date.now() + 3 * 60 * 1000,
        messages: [
          {
            address: args.address,
            amount: toNano(args.amount).toString(),
            stateInit: args.stateInit,
          },
        ],
      });
      onSuccess();
    },
    {
      onError: (error: any) => {
        console.log({ error });

        setTxLoading(false);
        showNotification({
          variant: "error",
          message: error.message,
        });
      },
    }
  );

  return { ...query, isLoading: txLoading };
};
