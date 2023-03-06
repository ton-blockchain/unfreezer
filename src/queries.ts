import { useMutation } from "@tanstack/react-query";
import { useNotification } from "components";
import { TX_SUBMIT_SUCCESS_TEXT, TX_SUBMIT_ERROR_TEXT } from "config";
import { useGetTransaction } from "connection";
import { useState } from "react";
import { useConnectionStore, useClientStore } from "store";
import { Address } from "ton";
import { Logger, waitForSeqno } from "utils";

export const useSendTransaction = () => {
  const { address } = useConnectionStore();
  const clientV2 = useClientStore().clientV2;
  const [txApproved, setTxApproved] = useState(false);
  const { showNotification } = useNotification();
  const [txLoading, setTxLoading] = useState(false);
  const getTransaction = useGetTransaction();

  const query = useMutation(
    async (vote: string) => {
      setTxLoading(true);

      const waiter = await waitForSeqno(
        clientV2!.openWalletFromAddress({
          source: Address.parse(address!),
        })
      );

      const onSuccess = async () => {
        setTxApproved(true);
        await waiter();
        setTxApproved(false);
        setTxLoading(false);
        showNotification({
          variant: "success",
          message: TX_SUBMIT_SUCCESS_TEXT,
        });
      };

      const transaction = getTransaction(vote, onSuccess);
      return transaction;
    },
    {
      onError: (error: any, vote) => {
        if (error instanceof Error) {
          Logger(error.message);
        }

        setTxLoading(false);
        setTxApproved(false);
        showNotification({ variant: "error", message: TX_SUBMIT_ERROR_TEXT });
      },
    }
  );

  return {
    ...query,
    txApproved,
    isLoading: txLoading,
  };
};
