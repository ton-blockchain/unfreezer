import { useState } from "react";
import { Typography } from "@mui/material";
import { Container } from "components";
import { StyledFlexColumn, textOverflow } from "styles";
import { useAccountDetails, useUnfreezeCallback, useUnfreezeTxn } from "hooks";
import { Exmaple } from "../components/Exampe";
import {
  StyledContainer,
  StyledContractAddressInput,
  StyledUnfreezeDetails,
} from "./styles";
import {
  DetailRow,
  AmountToSend,
  ExpectedStateInit,
  ActionButton,
  UnfreezeBlock,
  LatestStateInit,
  Balance,
} from "./Components";
/*
TODOs => 
- ton connect manifest => https://ton-community.github.io/unfreezer/, TON Unfreezer
- icon
- title in nav bar
- add support for non-TonConnect wallets (or otherwise remove them from menu)
- styling
- loading indications
- error indications

*/

export function Unfreeze() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState<number | undefined>(0.1);
  const [modifiedUnfreezeBlock, setModifiedUnfreezeBlock] = useState<
    number | undefined
  >();

  const { data: accountDetails, isInitialLoading: accoundDetailsLoading } =
    useAccountDetails(address);

  const { mutate: unfreeze, isLoading: txLoading } = useUnfreezeCallback();
  const unfreezeBlock = modifiedUnfreezeBlock || accountDetails?.unfreezeBlock;

  const { data: unfreezeTxnData, isInitialLoading: unfreezeTxnDataLoading } =
    useUnfreezeTxn(
      address,
      accountDetails?.stateInitHashToMatch,
      unfreezeBlock
    );


  return (
    <StyledContainer className="unfreeze">
      <Container title="Account To Unfreeze">
        <Exmaple onClick={setAddress} />
        <StyledContractAddressInput
          title="Contract Address"
          placeholder="Enter Address"
          value={address}
          onChange={setAddress}
        />
        <StyledFlexColumn gap={15}>
          <DetailRow isLoading={accoundDetailsLoading} title="Workchain:">
            <Typography> {accountDetails?.workchain || "-"}</Typography>
          </DetailRow>
          <Balance
            isLoading={accoundDetailsLoading}
            balance={accountDetails?.balance}
          />
          <DetailRow isLoading={accoundDetailsLoading} title="Status:">
            <Typography>{accountDetails?.accountState || "-"}</Typography>
          </DetailRow>
          <LatestStateInit
            isLoading={accoundDetailsLoading}
            stateInitHashToMatch={accountDetails?.stateInitHashToMatch}
          />
        </StyledFlexColumn>
      </Container>

      <StyledUnfreezeDetails
        disabled={!accountDetails?.isFrozen}
        title="Unfreeze Details"
      >
        <StyledFlexColumn gap={15}>
          <AmountToSend
            isLoading={accoundDetailsLoading}
            value={amount}
            onChange={setAmount}
          />
          <UnfreezeBlock
            isLoading={accoundDetailsLoading}
            unfreezeBlock={unfreezeBlock}
            onSubmit={setModifiedUnfreezeBlock}
          />
          <ExpectedStateInit
            isLoading={accoundDetailsLoading || unfreezeTxnDataLoading}
            stateInitHash={unfreezeTxnData?.stateInitHash}
            stateInitHashToMatch={accountDetails?.stateInitHashToMatch}
          />
        </StyledFlexColumn>
        <ActionButton
          disabled={!unfreezeTxnData?.stateInitHash}
          onSubmit={() =>
            unfreeze({
              stateInit: unfreezeTxnData!.stateInit,
              address,
              amount,
            })
          }
          loading={txLoading}
        />
      </StyledUnfreezeDetails>

      {/* TODO send the internal message via TC2 */}
      {/* Once we do, we can just invalidate the query in useAccountDetails until state of contract becomes active */}
    </StyledContainer>
  );
}
