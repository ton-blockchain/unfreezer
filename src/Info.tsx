import { Link, styled, Typography } from "@mui/material";
import { Container } from "components";
import React from "react";
import { StyledFlexColumn } from "styles";

function Info() {
  return (
    <StyledContainer title="What is TON Unfreezer" className="info">
      <StyledFlexColumn alignItems="flex-start">
        <Typography>Unfreeze a TON contract that ran out of gas for rent.</Typography>
        <Typography>
          In order to unfreeze a contract, a StateInit message with its latest code + data cells needs to be sent to it.
        </Typography>
        <Typography>1. Enter the address of the frozen contract</Typography>
        <Typography>
          2. The tool will try to detect the block seqno to restore from. You can also override the seqno.
        </Typography>
        <Typography>
          3. Specify a small amount of TON coins to send to the contract in order to revive it.
        </Typography>
        <Typography>4. Connect your wallet and send the transaction.</Typography>
        <Typography>
          5. The tool will monitor the contract until it is unfrozen.
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
