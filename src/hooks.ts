import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Address,
  TonClient,
  TonClient4,
  fromNano,
  Cell,
  toNano,
  Slice,
} from "ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { StateInit } from "ton";
import { useNotification } from "components";
import { handleMobileLink, waitForSeqno } from "utils";
import { TX_SUBMIT_SUCCESS_TEXT } from "config";
import { useState } from "react";
import { AccountDetails } from "types";
import { useConnectionStore } from "store";
import BN from "bn.js";

export async function getClientV2() {
  const endpoint = await getHttpEndpoint();
  return new TonClient({ endpoint });
}

export async function getClientV4() {
  // TODO clientV4 ton access dont work
  // const endpoint = await getHttpV4Endpoint();
  return new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
}

type StorageFees = {
  utime_since: number;
  bit_price_ps: number;
  cell_price_ps: number;
  mc_bit_price_ps: number;
  mc_cell_price_ps: number;
};

function configParse18(slice: Slice | null | undefined): StorageFees {
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

async function calculateAmountToSend(
  tc4: TonClient4,
  lastSeqno: number,
  frozenAccountDetails: AccountDetails,
  activeAccountDetails: AccountDetails,
  workchain: number,
  lastPaid: number
) {
  //   First one is "required storage fee", it should be calculated as
  // (now - last_paid) * (cells * cell_price_ps + bits * bit_price_ps) / 65536 + due_payment
  // last_paid, cells, bits and due_payment should be retrived from account  storage_stat
  // cell_price_ps and bit_price_ps should be from ConfigParam18 (for masterchain mc_bit_price_ps and mc_cell_price_ps).
  // This fee should not be editable.
  // Second one is "optional storage fee", it should be editable and it is fee for "future storage payments". It can be arbitrary, we just need to show for how much time this fee will be enough. Note, that when calculating "future storage payments" we need number of cells and bits in init_state (not in frozen state).
  // Regarding "optional storage fee", for it to be used, usually we need to send tons in non-bouncable message (otherwise many unfrozen contracts will bounce empty message and final balance will be 0).
  const now = Date.now() / 1000;
  const timeDelta = now - lastPaid;

  const config18Raw = await tc4.getConfig(lastSeqno, [18]);

  const config18 = configParse18(
    Cell.fromBoc(Buffer.from(config18Raw.config.cell, "base64"))[0].beginParse()
  );

  const cell_price_ps =
    workchain === -1 ? config18.mc_cell_price_ps : config18.cell_price_ps;
  const bit_price_ps =
    workchain === -1 ? config18.mc_bit_price_ps : config18.bit_price_ps;

  function priceForDelta(timeDeltaSec: number, accountDetails: AccountDetails) {
    console.log(accountDetails.storageStat?.used, "Shahar");
    console.log(
      timeDeltaSec,
      accountDetails.storageStat!.used.cells,
      cell_price_ps,
      accountDetails.storageStat!.used.bits,
      bit_price_ps,
      (timeDeltaSec *
        (accountDetails.storageStat!.used.cells * cell_price_ps +
          accountDetails.storageStat!.used.bits * bit_price_ps)) /
        2 ** 16
    );
    return new BN(
      (timeDeltaSec *
        (accountDetails.storageStat!.used.cells * cell_price_ps +
          accountDetails.storageStat!.used.bits * bit_price_ps)) /
        2 ** 16
    );
  }

  const MONTH_SEC = 24 * 3600 * 30;

  return {
    minAmountToSend: fromNano(
      priceForDelta(timeDelta, frozenAccountDetails).add(
        new BN(frozenAccountDetails.storageStat!.duePayment ?? 0)
      )
    ),
    pricePerMonth: fromNano(priceForDelta(MONTH_SEC, activeAccountDetails)),
  };
}

async function findUnfreezeBlock(
  tc4: TonClient4,
  lastKnownAccountDetails: AccountDetails,
  account: Address,
  safetyNumber: number = 0
): Promise<{
  unfreezeBlock: number;
  lastPaid: number;
  activeAccountDetails: AccountDetails;
}> {
  if (safetyNumber === 30) {
    throw new Error(
      "Reached 30 iterations searching for active seqno. Aborting."
    );
  }

  // Shards from all chains at timestamp
  const { shards: shardLastPaid } = await tc4.getBlockByUtime(
    lastKnownAccountDetails.storageStat!.lastPaid
  );

  // Get masterchain seqno (which we need to query v4)
  const nextSeqno = shardLastPaid.find((s) => s.workchain === -1)!.seqno - 1;

  // From this -> https://github.com/ton-community/ton-api-v4/blob/main/src/api/handlers/handleAccountGetLite.ts#L21
  // we understand that v4 is always to be queried by a masterchain seqno
  const { account: accountDetails } = await tc4.getAccount(nextSeqno, account);

  if (accountDetails.state.type === "frozen") {
    return findUnfreezeBlock(tc4, accountDetails, account, safetyNumber + 1);
  } else if (accountDetails.state.type === "uninit") {
    throw new Error(
      "Reached uninint block at seqno: " +
        nextSeqno +
        ". Unable to detect active seqno."
    );
  }

  return {
    unfreezeBlock: nextSeqno,
    lastPaid: lastKnownAccountDetails.storageStat!.lastPaid, // Last paid is retrieved from the *least recent* frozen state
    activeAccountDetails: accountDetails,
  };
}

export function useAccountDetails(accountStr: string) {
  const { showNotification } = useNotification();
  const query = useQuery(
    ["account_details", accountStr],
    async () => {
      const account = Address.parse(accountStr);

      const tc4 = await getClientV4();

      let {
        last: { seqno },
      } = await tc4.getLastBlock();

      seqno -= 2000;

      const { account: frozenAccountDetails } = await tc4.getAccountLite(
        seqno,
        account
      );

      const balance = fromNano(frozenAccountDetails.balance.coins);

      if (frozenAccountDetails.state.type !== "frozen") {
        return {
          accountState: frozenAccountDetails.state.type,
          isFrozen: false,
          balance,
        };
      }

      const { unfreezeBlock, lastPaid, activeAccountDetails } =
        await findUnfreezeBlock(tc4, frozenAccountDetails, account);

      const { minAmountToSend, pricePerMonth } = await calculateAmountToSend(
        tc4,
        seqno,
        frozenAccountDetails,
        activeAccountDetails,
        account.workChain,
        lastPaid
      );

      return {
        accountState: frozenAccountDetails.state.type,
        isFrozen: true,
        unfreezeBlock,
        balance,
        stateInitHashToMatch: frozenAccountDetails.state.stateHash,
        workchain: account.workChain,
        minAmountToSend,
        pricePerMonth,
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
      let error;

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
        error,
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
