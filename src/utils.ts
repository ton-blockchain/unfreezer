import { BASE_ERROR_MESSAGE, LOCAL_STORAGE_PROVIDER } from "config";
import _ from "lodash";
import { Wallet } from "ton";
import { TonConnect } from "@tonconnect/sdk";
import { isMobile } from "react-device-detect";

export const makeElipsisAddress = (address: string, padding = 6): string => {
  if (!address) return "";
  return `${address.substring(0, padding)}...${address.substring(
    address.length - padding
  )}`;
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function waitForSeqno(wallet: Wallet) {
  const seqnoBefore = await wallet.getSeqNo();

  return async () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      await delay(3000);
      let seqnoAfter;

      try {
        seqnoAfter = await wallet.getSeqNo();
      } catch (error) {}

      if (seqnoAfter && seqnoAfter > seqnoBefore) return;
    }
    throw new Error(BASE_ERROR_MESSAGE);
  };
}

export const getAdapterName = () => {
  return localStorage.getItem(LOCAL_STORAGE_PROVIDER);
};

export const Logger = (log: any) => {
  if (import.meta.env.DEV) {
    console.log(log);
  }
};

export const handleMobileLink = (connectorTC?: TonConnect) => {
  if (!isMobile) return;
  const Tonkeeper = connectorTC?.wallet?.device.appName;

  switch (Tonkeeper) {
    case "Tonkeeper":
      (window as any).location = "https://app.tonkeeper.com";
      break;

    default:
      break;
  }
};

export function nFormatter(num: number, digits = 2) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  if (num < 1) {
    return num.toFixed(5).replace(rx, "$1");
  }
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0";
}
