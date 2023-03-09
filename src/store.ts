import { create } from "zustand";
import { TonConnection } from "@ton-defi.org/ton-connection";
import { manifestUrl } from "config";
import TonConnect from "@tonconnect/sdk";

import { ConnectionStore } from "types";

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  address: undefined,
  connection: undefined,
  connectorTC: new TonConnect({
    manifestUrl,
  }),
  reset: () => set({ address: undefined, connection: undefined }),
  setAddress: (address) => set({ address }),
  setTonConnectionProvider: (provider) => {
    const _connection = new TonConnection();
    _connection.setProvider(provider);
    set({ connection: _connection });
  },
}));
