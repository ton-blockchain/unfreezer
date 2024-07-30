import { TonClient4 } from "ton";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";

const clients: TonClient4[] = [];

export async function getClientsV4() {
  if (clients.length === 0) {
    const tonAccessEndpoint = await getHttpV4Endpoint();
    clients.push(
      ...[
        new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" }),
        new TonClient4({ endpoint: tonAccessEndpoint }),
      ]
    );
  }

  return clients;
}

export async function executeV4Function<T>(
  func: (tc: TonClient4) => Promise<T>
) {
  const clients = await getClientsV4();
  return Promise.any(clients.map(func));
}
