import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Address,
  TonClient,
  TonClient4,
  fromNano,
  InternalMessage,
  CommonMessageInfo,
  Cell,
} from "ton";
import { useClientStore } from "./store";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import BN from "bn.js";
import { StateInit, beginCell } from "ton";

export async function getClientV2() {
  const endpoint = await getHttpEndpoint();
  return new TonClient({ endpoint });
}

export async function getClientV4() {
  // TODO - why not ton access?
  return new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
}

export const useFetchClients = () => {
  const setClients = useClientStore().setClients;

  return useMutation(async () => {
    const clientV2 = await getClientV2();
    const clientV4 = await getClientV4();
    setClients(clientV2, clientV4);
  });
};

export const useGetClientsOnLoad = () => {
  const { mutate: getClients } = useFetchClients();

  return () => getClients();
};

type AccountDetails = {
  storageStat: {
    lastPaid: number;
    duePayment: string | null;
    used: {
      bits: number;
      cells: number;
      publicCells: number;
    };
  } | null;
};

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
  return useQuery(["account_details", accountStr], async () => {
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

    const unfreezeBlock = await findUnfreezeBlock(tc4, accountDetails, account);

    return {
      accountState: accountDetails.state.type,
      isFrozen: true,
      unfreezeBlock,
      balance,
      stateInitHashToMatch: accountDetails.state.stateHash,
      workchain: account.workChain,
    };
  });
}

export function useUnfreezeTxn(
  accountStr: string,
  stateInitHashToMatch?: string,
  unfreezeBlock?: number
) {
  return useQuery(
    ["unfreeze", accountStr, unfreezeBlock],
    async () => {
      const account = Address.parse(accountStr);

      const tc4 = await getClientV4();

      const { account: accountDetails } = await tc4.getAccount(
        unfreezeBlock!,
        account
      );

      if (accountDetails.state.type !== "active") {
        throw new Error("Account isn't active at specified block");
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
        throw new Error(
          `Expecting state init hash ${stateInitHashToMatch}, got ${stateInitHash}`
        );
      }

      return {
        stateInit: c.toBoc().toString("base64"),
        stateInitHash,
      };
    },
    { enabled: !!unfreezeBlock && !!stateInitHashToMatch }
  );
}
