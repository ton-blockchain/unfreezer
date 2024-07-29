import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Address, TonClient, toNano } from "ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { useNotification } from "../components";
import { waitForSeqno } from "utils";
import { TX_SUBMIT_SUCCESS_TEXT } from "config";
import { useState } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

export const MONTH_SEC = 24 * 3600 * 30;

export async function getClientV2() {
  const endpoint = await getHttpEndpoint();
  return new TonClient({ endpoint });
}

type UnfreezeArgs = {
  stateInit: string;
  address: string;
  amount?: number;
};

export const useUnfreezeCallback = () => {
  const connectedWalletAddress = useTonWallet()?.account?.address;
  const [connectorTC] = useTonConnectUI();
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

      await connectorTC.sendTransaction({
        validUntil: Date.now() + 3 * 60 * 1000,
        messages: [
          {
            address: args.address,
            amount: toNano(args.amount.toFixed(9)).toString(),
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
