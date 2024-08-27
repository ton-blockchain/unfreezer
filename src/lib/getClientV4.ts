import { TonClient4 } from "ton";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { withRetry } from "./retry";

const clients: TonClient4[] = [];

export async function getClientsV4() {
  if (clients.length === 0) {
    clients.push(
      new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" })
    );

    try {
      const tonAccessEndpoint = await getHttpV4Endpoint();
      clients.push(new TonClient4({ endpoint: tonAccessEndpoint }));
    } catch (e) {
      console.error("Failed to get TonAccess endpoint", e);
    }
  }

  return clients;
}

export async function executeV4Function<T>(
  func: (tc: TonClient4) => Promise<T>
) {
  const clients = await getClientsV4();

  return withRetry(
    () => Promise.any(clients.map(func)),
    () => ({
      retries: 5,
    })
  );
}
