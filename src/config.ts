import { Address } from "ton";

export const GITHUB_URL = "https://github.com/ton-community/unfreezer";
export const BASE_ERROR_MESSAGE = "Oops, something went wrong";

export const APPROVE_TX = "Please check wallet for pending transaction";
export const TX_APPROVED_AND_PENDING = "Transaction pending";

export const manifestUrl =
  "https://unfreezer.ton.org/tonconnect-manifest.json";

export const TX_FEE = 0.5;

export const LOCAL_STORAGE_PROVIDER = "ton_vote_wallet_provider";

export const TX_SUBMIT_ERROR_TEXT = "Transaction failed";
export const TX_SUBMIT_SUCCESS_TEXT = "Transaction completed";

export const isDev = () => import.meta.env.DEV;
