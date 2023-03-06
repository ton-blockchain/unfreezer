import { useState } from "react";
import { useAccountDetails } from "store/hooks";
import { useUnfreezeTxn } from "./store/hooks";
import BN from "bn.js";
import { InternalMessage, StateInit, toNano } from "ton";
import { useConnectionStore } from "store";

/*
TODOs => 
- ton connect manifest
- icon
- title in nav bar
- add support for non-TonConnect wallets (or otherwise remove them from menu)
- styling
- loading indications
- error indications

*/

export function Unfreeze() {
  const [address, setAddress] = useState("");
  const [value, setValue] = useState(0.5);

  const { data, isLoading, error } = useAccountDetails(address);
  const { data: unfreezeTxnData, error: unfreezeTxnError } = useUnfreezeTxn(
    address,
    data?.stateInitHashToMatch,
    data?.unfreezeBlock
  );

  const { connectorTC, connection } = useConnectionStore();

  return (
    <div>
      <h3>Examples</h3>
      <div
        style={{ display: "flex", gap: 4, cursor: "pointer", color: "blue" }}
      >
        <span
          onClick={() => {
            setAddress("kf-kkdY_B7p-77TLn2hUhM6QidWrrsl8FYWCIvBMpZKprBtN");
          }}
        >
          Frozen #1
        </span>
        <span
          onClick={() => {
            setAddress("kf8guqdIbY6kpMykR8WFeVGbZcP2iuBagXfnQuq0rGrxgE04");
          }}
        >
          Frozen #2
        </span>
        <span
          onClick={() => {
            setAddress("EQDerEPTIh0O8lBdjWc6aLaJs5HYqlfBN2Ruj1lJQH_6vcaZ");
          }}
        >
          Not frozen
        </span>
      </div>

      <h3>Unfreeze</h3>
      <input
        style={{ width: 500, marginBottom: 10 }}
        placeholder="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      {!!error && <div>{error.toString()}</div>}

      {isLoading && <div>Loading...</div>}
      {!isLoading && data && (
        <div>
          <div>Account state: {data.accountState}</div>
          <div>Workchain: {data.workchain}</div>
          <div>Balance: {data.balance}</div>
          {/* TODO can be overridden */}
          <div>Unfreeze block: {data.unfreezeBlock}</div>
          <br />
          <div>Expected state init hash to unfreeze:</div>
          <b>{data.stateInitHashToMatch}</b>
        </div>
      )}
      <div>
        {!!unfreezeTxnError && <div>{unfreezeTxnError.toString()}</div>}
        <div>Actual state init hash:</div>
        <b>{unfreezeTxnData?.stateInitHash ?? ""}</b>
        <br />
        <br />
        {/* TODO send the internal message via TC2 */}
        {/* Once we do, we can just invalidate the query in useAccountDetails until state of contract becomes active */}
        <button
          disabled={!unfreezeTxnData?.stateInitHash || !connectorTC.connected}
          onClick={() => {
            console.log(connectorTC.connected, "hi");
            if (!connectorTC.connected || !unfreezeTxnData) return;

            console.log(unfreezeTxnData.stateInit);

            connectorTC.sendTransaction({
              messages: [
                {
                  address: address,
                  amount: toNano(value).toString(),
                  stateInit: unfreezeTxnData.stateInit,
                },
              ],
              validUntil: Date.now() + 3 * 60 * 1000,
            });
          }}
        >
          Issue TXN
        </button>
      </div>
    </div>
  );
}
