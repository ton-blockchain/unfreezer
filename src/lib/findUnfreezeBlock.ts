import { Address } from "ton";
import { AccountDetails } from "types";
import { executeV4Function } from "./getClientV4";

export async function findUnfreezeBlock(
  lastKnownAccountDetails: AccountDetails,
  account: Address,
  overrideBlock: number | undefined,
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

  let nextSeqno: number;

  if (!overrideBlock) {
    // Shards from all chains at timestamp
    const { shards: shardLastPaid } = await executeV4Function((tc4) =>
      tc4.getBlockByUtime(lastKnownAccountDetails.storageStat!.lastPaid)
    );

    // Get masterchain seqno (which we need to query v4)
    nextSeqno = shardLastPaid.find((s) => s.workchain === -1)!.seqno - 1;
  } else {
    nextSeqno = overrideBlock;
  }

  // From this -> https://github.com/ton-community/ton-api-v4/blob/main/src/api/handlers/handleAccountGetLite.ts#L21
  // we understand that v4 is always to be queried by a masterchain seqno
  const { account: accountDetails } = await executeV4Function((tc4) =>
    tc4.getAccount(nextSeqno, account)
  );

  if (accountDetails.state.type !== "active" && !!accountDetails.storageStat) {
    return findUnfreezeBlock(
      accountDetails,
      account,
      overrideBlock,
      safetyNumber + 1
    );
  } else if (
    !accountDetails.storageStat &&
    accountDetails.state.type === "uninit"
  ) {
    throw new Error(
      "Reached uninint block at seqno: " +
        nextSeqno +
        ". Unable to detect active seqno."
    );
  }

  return {
    unfreezeBlock: nextSeqno,
    lastPaid: lastKnownAccountDetails.storageStat!.lastPaid,
    activeAccountDetails: accountDetails,
  };
}
