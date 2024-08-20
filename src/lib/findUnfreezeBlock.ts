import { Address, TonClient4 } from "ton";
import { AccountDetails } from "types";
import { executeV4Function } from "./getClientV4";
import {
  accountAtBlock,
  accountAtLatestBlock,
  latestBlock,
} from "./useAccountDetails";

type ExtractReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type Account = UnwrapPromise<
  ExtractReturnType<TonClient4["getAccount"]>
>["account"];

async function blockFromUtime(utime: number) {
  const { shards } = await executeV4Function((tc4) =>
    tc4.getBlockByUtime(utime)
  );

  return shards.find((s) => s.workchain === -1)!.seqno;
}

function statusFromAccount(details: Account) {
  console.log(details);
  if (details.state.type === "uninit") {
    return "uninit";
  } else if (details.state.type === "active") {
    return "active";
  } else if (details.state.type === "frozen") {
    if (details.storageStat) {
      return "frozen";
    } else {
      throw new Error("Frozen account without storageStat");
    }
  }
}

export async function findUnfreezeBlock(
  address: Address,
  initialBlockNumber?: number
): Promise<{
  unfreezeBlock: number;
  lastPaid: number;
  activeAccountDetails: AccountDetails;
}> {
  let safety = 130;

  const initialDetails = await accountAtLatestBlock(address);
  if (initialDetails[0].state.type === "active") {
    throw new Error("Account is already active");
  }

  let blockNumber = initialBlockNumber ?? (await latestBlock());

  console.log("blockToStartSearchFrom", blockNumber);

  let found = false;
  let account: Account;

  let lastKnownActiveBlock = Number.MIN_SAFE_INTEGER;
  let lastKnownInactiveBlock = Number.MAX_SAFE_INTEGER;

  while (!found && safety-- > 0) {
    console.log("Inspecting block", blockNumber);

    // From this -> https://github.com/ton-community/ton-api-v4/blob/main/src/api/handlers/handleAccountGetLite.ts#L21
    // we understand that v4 is always to be queried by a masterchain seqno
    account = await accountAtBlock(address, blockNumber);
    const status = statusFromAccount(account);

    // Account is active so go forward to
    if (status === "active") {
      // See if we can find a newer block at which the account is active
      lastKnownActiveBlock = Math.max(lastKnownActiveBlock, blockNumber);
      blockNumber++;
    } else if (status === "uninit") {
      throw new Error("Account is uninit");
    } else if (status === "frozen") {
      // See if we can find an older block at which the account is frozen
      lastKnownInactiveBlock = Math.min(lastKnownInactiveBlock, blockNumber);
      blockNumber = Math.min(
        await blockFromUtime(account.storageStat!.lastPaid!),
        blockNumber - 1
      );
    }

    console.log("Status", {
      status,
      lastKnownActiveBlock,
      lastKnownInactiveBlock,
    });

    if (
      status == "active" &&
      lastKnownInactiveBlock - lastKnownActiveBlock === 1
    ) {
      console.log("Found active account at seqno: ", lastKnownActiveBlock);
      blockNumber = lastKnownActiveBlock;
      break;
    }
  }

  return {
    unfreezeBlock: blockNumber,
    lastPaid: account!.storageStat!.lastPaid,
    activeAccountDetails: account!,
  };
}
