import { Address, TonClient4 } from "ton";
import { AccountDetails } from "types";

export async function findUnfreezeBlock(
  tc4: TonClient4,
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

  let nextSeqno;

  if (!overrideBlock) {
    // Shards from all chains at timestamp
    const { shards: shardLastPaid } = await tc4.getBlockByUtime(
      lastKnownAccountDetails.storageStat!.lastPaid
    );

    // Get masterchain seqno (which we need to query v4)
    nextSeqno = shardLastPaid.find((s) => s.workchain === -1)!.seqno - 1;
  } else {
    nextSeqno = overrideBlock;
  }

  // From this -> https://github.com/ton-community/ton-api-v4/blob/main/src/api/handlers/handleAccountGetLite.ts#L21
  // we understand that v4 is always to be queried by a masterchain seqno
  const { account: accountDetails } = await tc4.getAccount(nextSeqno, account);

  if (accountDetails.state.type !== "active" && !!accountDetails.storageStat) {
    return findUnfreezeBlock(
      tc4,
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
