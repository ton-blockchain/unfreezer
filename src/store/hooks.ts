import { useMutation } from "@tanstack/react-query";
import { TonClient, TonClient4 } from "ton";
import { useClientStore } from "./store";
import { getHttpEndpoint } from "@orbs-network/ton-access";

export async function getClientV2() {
  const endpoint = await getHttpEndpoint();
  return new TonClient({ endpoint });
}

export async function getClientV4() {
  return new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
}

export const useFetchClients = () => {
  const setClients = useClientStore().setClients;

  return useMutation(async () => {
    const clientV2 = await getClientV2();
    const clientV4 = await getClientV4();
    setClients(clientV2, clientV4);
  });
};

export const useGetClientsOnLoad = () => {
  const { mutate: getClients } = useFetchClients();

  return () => getClients();
};
