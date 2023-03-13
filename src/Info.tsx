import { Link, styled, Typography } from "@mui/material";
import { Container } from "components";
import React from "react";
import { StyledFlexColumn } from "./styles";

function Info() {
  return (
    <StyledContainer title="What is TON Unfreezer" className="info">
      <StyledFlexColumn alignItems="flex-start">
        <Typography>
          Smart contracts in TON need to pay rent for the storage space they
          occupy.
        </Typography>
        <Typography>
          When a smart contract has no funds to pay for storage fee for a long
          time, it freezes and its storage becomes minimized.
        </Typography>
        <Typography>
          In order to revive a frozen smart contract, you need to provide its
          latest-known storage state back first.
        </Typography>
        <Typography>
          This tool helps to unfreeze accounts by automatically detecting
          relevant state, composing and sending the corresponding message to the
          contract.
        </Typography>
        <Typography>To use it:</Typography>
        <Typography>1. Enter the address of the frozen contract</Typography>
        <Typography>
          2. Specify the number of months you want to top up the contract with
          rent
        </Typography>
        <Typography>
          3. Connect your wallet and send the transaction.
        </Typography>
        <Typography>
          4. Wait until the transaction is processed. The tool will monitor the
          contract until it is unfrozen.
        </Typography>
        <Typography>
          Support:{" "}
          <Link href="https://t.me/tonunfreezer" target="_blank">
            https://t.me/tonunfreezer
          </Link>
        </Typography>
      </StyledFlexColumn>
    </StyledContainer>
  );
}

export default Info;

const StyledContainer = styled(Container)({
  width: 400,
});
