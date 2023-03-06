import { Address } from "ton";

export enum Provider {
  TONKEEPER = "TONKEEPER",
  TONHUB = "TONHUB",
  EXTENSION = "EXTENSION",
  OPEN_MASK = "OPEN_MASK",
  MY_TON_WALLET = "MY_TON_WALLET",
}

export interface WalletProvider {
  type: Provider;
  icon: string;
  title: string;
  description: string;
  mobileDisabled?: boolean;
  reminder?: boolean;
}

