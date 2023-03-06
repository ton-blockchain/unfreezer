import { create } from "zustand";
import { TonConnection } from "@ton-defi.org/ton-connection";
import { manifestUrl } from "config";
import TonConnect from "@tonconnect/sdk";

import { ClientsStore, ConnectionStore } from "./types";

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

export const useClientStore = create<ClientsStore>((set, get) => ({
  clientV2: undefined,
  clientV4: undefined,
  setClients: (clientV2, clientV4) => set({ clientV2, clientV4 }),
}));
