// Thin typed client for the toncenter v2 and v3 HTTP APIs.

import { Cell, loadShardAccount } from "@ton/core";
import type { ShardAccount } from "@ton/core";
import type { Network } from "./types.ts";

// ─── API keys & endpoints ───

// Embedded keys are frontend-safe: method-restricted and rate-limited per IP.
// For tests/CLI, override with the TONCENTER_API_KEY env var (high-RPS key).
const envKey = typeof process !== "undefined" ? process.env?.TONCENTER_API_KEY : undefined;

const API_KEYS: Record<Network, string> = {
  mainnet: envKey || "02ebde000172a2efd51fce54e4f94a9d11549df14a736553d099586db5f4b288",
  testnet: envKey || "7c439fd5a9a143e47ff002ec9b654e640ad91290cba1f4cf0e8c0f763c7163bc",
};

const V2_BASE: Record<Network, string> = {
  mainnet: "https://toncenter.com/api/v2",
  testnet: "https://testnet.toncenter.com/api/v2",
};

const V3_BASE: Record<Network, string> = {
  mainnet: "https://toncenter.com/api/v3",
  testnet: "https://testnet.toncenter.com/api/v3",
};

/** The toncenter API key in effect for the given network. */
export function toncenterApiKey(network: Network): string {
  return API_KEYS[network];
}

// ─── HTTP ───

type QueryParams = Record<string, string | number>;

export async function fetchWithRetry(url: string, retries = 4): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        lastErr = new Error("HTTP 429: rate limited");
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

function buildUrl(base: string, path: string, network: Network, params: QueryParams): URL {
  const url = new URL(`${base}/${path}`);
  url.searchParams.set("api_key", API_KEYS[network]);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  return url;
}

async function toncenterV2<T>(network: Network, method: string, params: QueryParams = {}): Promise<T> {
  const url = buildUrl(V2_BASE[network], method, network, params);
  const res = await fetchWithRetry(url.toString());
  const json = (await res.json()) as { ok: boolean; result: T; error?: unknown };
  if (!json.ok) throw new Error(`toncenter v2 ${method}: ${JSON.stringify(json.error)}`);
  return json.result;
}

async function toncenterV3<T>(network: Network, endpoint: string, params: QueryParams = {}): Promise<T> {
  const url = buildUrl(V3_BASE[network], endpoint, network, params);
  const res = await fetchWithRetry(url.toString());
  return (await res.json()) as T;
}

// ─── v2 wrappers ───

export interface V2AccountInfo {
  balance: string;
  state: "active" | "frozen" | "uninitialized";
  code: string;
  data: string;
  frozen_hash?: string;
  last_transaction_id?: { lt: string; hash: string };
}

interface V2ConfigParam {
  config: { bytes: string };
}

/** Current account state via v2 getAddressInformation. */
export function getAccountInfo(address: string, network: Network): Promise<V2AccountInfo> {
  return toncenterV2<V2AccountInfo>(network, "getAddressInformation", { address });
}

/** Parsed ShardAccount at the given masterchain seqno (latest state if omitted). */
export async function getShardAccountCell(
  address: string,
  network: Network,
  seqno?: number,
): Promise<ShardAccount> {
  const params: QueryParams = { address };
  if (seqno !== undefined) params.seqno = seqno;
  const result = await toncenterV2<{ bytes: string }>(network, "getShardAccountCell", params);
  const boc = Cell.fromBoc(Buffer.from(result.bytes, "base64"))[0]!;
  return loadShardAccount(boc.beginParse());
}

/** Raw cell of a blockchain config parameter via v2 getConfigParam. */
export async function getConfigParamCell(network: Network, configId: number): Promise<Cell> {
  const result = await toncenterV2<V2ConfigParam>(network, "getConfigParam", { config_id: configId });
  return Cell.fromBoc(Buffer.from(result.config.bytes, "base64"))[0]!;
}

// ─── v3 wrappers ───

export interface V3AccountState {
  account_status: string;
  frozen_hash: string | null;
  code_hash: string | null;
  data_hash: string | null;
}

export interface V3Transaction {
  hash: string;
  lt: string;
  now: number;
  mc_block_seqno: number;
  orig_status: string;
  end_status: string;
  prev_trans_lt: string;
  account_state_after: V3AccountState;
}

/** The single transaction matching `params` via v3 /transactions, or null. */
export async function v3Transaction(
  network: Network,
  params: QueryParams,
): Promise<V3Transaction | null> {
  const data = await toncenterV3<{ transactions?: V3Transaction[] }>(network, "transactions", {
    ...params,
    limit: 1,
  });
  return data.transactions?.[0] ?? null;
}
