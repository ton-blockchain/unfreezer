import { useState } from "react";
import { useAccountDetails } from "store/hooks";
import { useUnfreezeTxn } from "./store/hooks";
import BN from "bn.js";
import { InternalMessage } from "ton";

export function Unfreeze() {
  const [address, setAddress] = useState("");
  const [value, setValue] = useState(0);

  const { data, isLoading, error } = useAccountDetails(address);
  const { data: unfreezeTxnData, error: unfreezeTxnError } = useUnfreezeTxn(
    address,
    new BN(value),
    data?.stateInitHashToMatch,
    data?.unfreezeBlock
  );

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
          <div>Balance: {data.balance}</div>
          {/* TODO can be overridden */}
          <div>Unfreeze block: {data.unfreezeBlock}</div>
          <br />
          <div>Expected state init hash to unfreeze:</div>
          <div>{data.stateInitHashToMatch}</div>
        </div>
      )}
      <div>
        {!!unfreezeTxnError && <div>{unfreezeTxnError.toString()}</div>}
        <div>Actual state init hash:</div>
        <div>{unfreezeTxnData?.stateInitHash ?? ""}</div>
        <br />
        {/* TODO send the internal message via TC2 */}
        {/* Once we do, we can just invalidate the query in useAccountDetails until state of contract becomes active */}
        <button disabled={!unfreezeTxnData?.stateInitHash}>Issue TXN</button>
      </div>
    </div>
  );
}
