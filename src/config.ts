import { Address } from "ton";

export const GITHUB_URL = ''
export const BASE_ERROR_MESSAGE = "Oops, something went wrong";

export const APPROVE_TX = "Please check wallet for pending transaction";
export const TX_APPROVED_AND_PENDING = "Transaction pending";


export const manifestUrl =
  "https://ton-community.github.io/unfreezer/tonconnect-manifest.json";

export const TX_FEE = 0.5;



export const LOCAL_STORAGE_PROVIDER = "ton_vote_wallet_provider";



export const TX_SUBMIT_ERROR_TEXT = 'Transaction failed'
export const TX_SUBMIT_SUCCESS_TEXT = 'Transaction completed'


export const CONTRACT_ADDRESS = Address.parse(
  "EQCVy5bEWLQZrh5PYb1uP3FSO7xt4Kobyn4T9pGy2c5-i-GS"
);


export const isDev = () => import.meta.env.DEV