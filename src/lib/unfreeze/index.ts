// Public API of the unfreeze library.
//
// Typical flow:
//   const details = await fetchAccountDetails(address, network, onProgress);
//   if (details.isFrozen && details.unfreezeBlock) {
//     const state = await getStateForUnfreeze({
//       address, network, onProgress,
//       unfreezeBlock: details.unfreezeBlock,
//       stateInitHashToMatch: details.stateInitHashToMatch,
//       freezeTx: details.freezeTx,
//     });
//     // send a message to the account carrying state.stateInitBoc
//   }

export { fetchAccountDetails } from "./account-details.ts";
export { getStateForUnfreeze, type GetStateForUnfreezeOptions } from "./state-recovery.ts";
export type {
  AccountDetails,
  FreezeTxRef,
  Network,
  ProgressCallback,
  StateForUnfreeze,
} from "./types.ts";
