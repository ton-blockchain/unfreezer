import React, { useState } from "react";
import { Button } from "./Button";
import { useTonConnectModal } from "@tonconnect/ui-react";

export function ConnectButton({
  text,
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  const modal = useTonConnectModal();
  return (
    <>
      <Button className={className} onClick={() => modal.open()}>
        {text || "Connect wallet"}
      </Button>
    </>
  );
}
