import { useState } from "react";
import { Typography } from "@mui/material";
import { Container } from "components";
import { StyledFlexColumn } from "styles";
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
import { useConnectionStore } from "store";
import { useSearchParams } from "react-router-dom";
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
  let [searchParams, setSearchParams] = useSearchParams();
  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [amount, setAmount] = useState<number | undefined>(0.1);
  const [modifiedUnfreezeBlock, setModifiedUnfreezeBlock] = useState<
    number | undefined
  >();

  const { data: accountDetails, isFetching: accoundDetailsLoading } =
    useAccountDetails(address);

  const { mutate: unfreeze, isLoading: txLoading } = useUnfreezeCallback();
  const { address: connectedWalletAddress } = useConnectionStore();
  const unfreezeBlock = modifiedUnfreezeBlock || accountDetails?.unfreezeBlock;

  const {
    data: unfreezeTxnData,
    isInitialLoading: unfreezeTxnDataLoading,
  } = useUnfreezeTxn(
    address,
    accountDetails?.stateInitHashToMatch,
    unfreezeBlock
  );

  const onSubmit = () => {
    unfreeze({
      stateInit: unfreezeTxnData!.stateInit || '',
      address,
      amount,
    });
  };

  const onAddressChange = (value: string) => {
    setSearchParams(new URLSearchParams(`address=${value}`));
    setAddress(value);
    setModifiedUnfreezeBlock(undefined);
  };

  return (
    <StyledContainer className="unfreeze">
      <Container title="Contract To Unfreeze">
        <Exmaple onClick={onAddressChange} />
        <StyledContractAddressInput
          title="Contract Address"
          placeholder="Enter Address"
          value={address}
          onChange={onAddressChange}
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
        disabled={!accountDetails?.isFrozen && !!connectedWalletAddress}
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
            initialUnfreezeBlock={accountDetails?.unfreezeBlock}
          />
          <ExpectedStateInit
            isLoading={accoundDetailsLoading || unfreezeTxnDataLoading}
            stateInitHash={unfreezeTxnData?.stateInitHash}
            error={unfreezeTxnData?.error}
          />
        </StyledFlexColumn>
        <ActionButton
          disabled={!unfreezeTxnData?.stateInitHash}
          onSubmit={onSubmit}
          loading={txLoading}
        />
      </StyledUnfreezeDetails>
    </StyledContainer>
  );
}
