import { Link, styled, Typography } from "@mui/material";
import { Container } from "components";
import React from "react";
import { StyledFlexColumn } from "styles";

function Info() {
  return (
    <StyledContainer title="What is TON Unfreezer" className="info">
      <StyledFlexColumn alignItems="flex-start">
        <Typography>Unfreeze a frozen TON account with this tool</Typography>
        <Typography>
          In order to unfreeze an account, a message with the latest stateinit
          (code + data cells) need to be sent to it
        </Typography>
        <Typography>1. Enter the address of the frozen account</Typography>
        <Typography>
          2. The tool will try to detect the block number to restore from
          automatically, otherwise you can override it.
        </Typography>
        <Typography>
          3. Specify the value to send to the contract, in order to revive it
        </Typography>
        <Typography>4. Connect your wallet and send the transaction</Typography>
        <Typography>
          5. The tool will monitor the account until it is unfrozen
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
  width:400
})
