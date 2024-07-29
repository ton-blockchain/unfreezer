import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
import { Container } from "components";
import { StyledFlexColumn } from "../styles";
import { useUnfreezeCallback } from "lib/useUnfreezeCallback";
import { useAccountDetails } from "lib/useAccountDetails";
import { useUnfreezeTxn } from "lib/useUnfreezeTxn";
import { Exmaple } from "../components/Exampe";
import {
  StyledContainer,
  StyledContractAddressInput,
  StyledUnfreezeDetails,
} from "./styles";
import {
  DetailRow,
  AmountToRevive,
  ExpectedStateInit,
  ActionButton,
  UnfreezeBlock,
  Balance,
  TotalAmount,
} from "./Components";
import { useSearchParams } from "react-router-dom";
import { MonthsInput } from "./Components";
import { useTonWallet } from "@tonconnect/ui-react";

export function Unfreeze() {
  let [searchParams, setSearchParams] = useSearchParams();
  const [address, setAddress] = useState(searchParams.get("address") || "");
  const [months, setMonths] = useState<number>(12);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [modifiedUnfreezeBlock, setModifiedUnfreezeBlock] = useState<
    number | undefined
  >();

  const { data: accountDetails, isFetching: accoundDetailsLoading } =
    useAccountDetails(address, modifiedUnfreezeBlock);

  useEffect(() => {
    setTotalAmount(
      months * parseFloat(accountDetails?.pricePerMonth ?? "0") +
        parseFloat(accountDetails?.minAmountToSend ?? "0")
    );
  }, [months, accountDetails?.pricePerMonth, accountDetails?.minAmountToSend]);

  const { mutate: unfreeze, isLoading: txLoading } = useUnfreezeCallback();
  const connectedWalletAddress = useTonWallet()?.account?.address;
  const unfreezeBlock = modifiedUnfreezeBlock || accountDetails?.unfreezeBlock;

  const { data: unfreezeTxnData, isInitialLoading: unfreezeTxnDataLoading } =
    useUnfreezeTxn(
      address,
      accountDetails?.stateInitHashToMatch ?? null,
      unfreezeBlock
    );

  const onSubmit = () => {
    unfreeze({
      stateInit: unfreezeTxnData!.stateInit || "",
      address,
      amount: totalAmount,
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
          <Balance
            isLoading={accoundDetailsLoading}
            balance={accountDetails?.balance}
          />
          <DetailRow isLoading={accoundDetailsLoading} title="Status:">
            <Typography>{accountDetails?.accountState || "-"}</Typography>
          </DetailRow>
        </StyledFlexColumn>
      </Container>

      <StyledUnfreezeDetails
        disabled={!accountDetails?.isFrozen && !!connectedWalletAddress}
        title="Unfreeze Details"
      >
        <StyledFlexColumn gap={15}>
          <AmountToRevive
            isLoading={accoundDetailsLoading}
            value={parseFloat(accountDetails?.minAmountToSend ?? "0")}
          />
          <MonthsInput
            isLoading={accoundDetailsLoading}
            value={months}
            onChange={(v) => v !== undefined && setMonths(v)}
            pricePerMonth={parseFloat(accountDetails?.pricePerMonth ?? "0")}
          />
          <TotalAmount isLoading={accoundDetailsLoading} value={totalAmount} />
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
