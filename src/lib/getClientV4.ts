import { TonClient4 } from "ton";

export async function getClientV4() {
  // TODO clientV4 ton access dont work
  // const endpoint = await getHttpV4Endpoint();
  return new TonClient4({ endpoint: "https://mainnet-v4.tonhubapi.com" });
}
