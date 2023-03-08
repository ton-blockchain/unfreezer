import TonhubLogo from "assets/tonhub.png";
import ExtensionLogo from "assets/chrome.svg";

import { Provider, WalletProvider } from "types";
import { Address } from "ton";

export const GITHUB_URL = ''
export const BASE_ERROR_MESSAGE = "Oops, something went wrong";

export const APPROVE_TX = "Please check wallet for pending transaction";
export const TX_APPROVED_AND_PENDING = "Transaction pending";

export const walletAdapters: WalletProvider[] = [
 
  {
    type: Provider.TONHUB,
    icon: TonhubLogo,
    title: "Tonhub",
    description: "A mobile wallet in your pocket",
    reminder: true,
  },
  {
    type: Provider.EXTENSION,
    icon: ExtensionLogo,
    title: "TON Wallet",
    description: "TON Wallet Plugin for Google Chrome",
    mobileDisabled: true,
  },
];


// export const manifestUrl = "https://ton-community.github.io/unfreezer";
export const manifestUrl = "https://ton.vote/tonconnect-manifest.json";

export const TX_FEE = 0.5;



export const LOCAL_STORAGE_PROVIDER = "ton_vote_wallet_provider";



export const TX_SUBMIT_ERROR_TEXT = 'Transaction failed'
export const TX_SUBMIT_SUCCESS_TEXT = 'Transaction completed'


export const CONTRACT_ADDRESS = Address.parse(
  "EQCVy5bEWLQZrh5PYb1uP3FSO7xt4Kobyn4T9pGy2c5-i-GS"
);
