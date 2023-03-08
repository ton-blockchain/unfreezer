import { useState } from "react";
import { Chip, Skeleton, styled, Typography } from "@mui/material";
import { Button, ConnectButton, Container, Input } from "components";
import { StyledFlexColumn, StyledFlexRow, textOverflow } from "styles";
import { useAccountDetails, useUnfreezeCallback, useUnfreezeTxn } from "hooks";
import { useConnectionStore } from "store/store";

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

  const { data: accountDetails, isInitialLoading: accoundDetailsLoading } =
    useAccountDetails(address);

  const { mutate: unfreeze, isLoading: txLoading } = useUnfreezeCallback();

  const { data: unfreezeTxnData, isInitialLoading: unfreezeTxnDataLoading } =
    useUnfreezeTxn(
      address,
      accountDetails?.stateInitHashToMatch,
      accountDetails?.unfreezeBlock
    );

  return (
    <StyledContainer title="Unfreeze">
      <Exmaples onClick={setAddress} />
      <StyledInput
        label="Wallet Address"
        value={address}
        onChange={setAddress}
      />

      <StyledFlexColumn alignItems="flex-start" gap={0}>
        <DetailRow
          isLoading={accoundDetailsLoading}
          title="Account state:"
          value={accountDetails?.accountState}
        />
        <DetailRow
          isLoading={accoundDetailsLoading}
          title="Workchain:"
          value={accountDetails?.workchain}
        />
        <DetailRow
          isLoading={accoundDetailsLoading}
          title="Balance:"
          value={accountDetails?.balance}
        />
        <DetailRow
          isLoading={accoundDetailsLoading}
          title="Unfreeze block:"
          value={accountDetails?.unfreezeBlock}
        />
        <DetailRow
          isLoading={accoundDetailsLoading}
          title="Expected state init hash to unfreeze:"
          value={accountDetails?.stateInitHashToMatch}
        />
        <DetailRow
          isLoading={unfreezeTxnDataLoading}
          title="Actual state init hash:"
          value={unfreezeTxnData?.stateInitHash}
        />
      </StyledFlexColumn>

      {/* TODO send the internal message via TC2 */}
      {/* Once we do, we can just invalidate the query in useAccountDetails until state of contract becomes active */}
      <ActionButton
        disabled={!unfreezeTxnData?.stateInitHash}
        onSubmit={() =>
          unfreeze({ stateInit: unfreezeTxnData!.stateInit, address })
        }
        loading={txLoading}
      />
    </StyledContainer>
  );
}

const ActionButton = ({
  disabled,
  onSubmit,
  loading,
}: {
  disabled: boolean;
  onSubmit: () => void;
  loading: boolean;
}) => {
  const { address: connectedWalletAddress } = useConnectionStore();

  if (!connectedWalletAddress) {
    return (
      <StyledSubmit>
        <ConnectButton />
      </StyledSubmit>
    );
  }
  return (
    <StyledSubmit>
      <Button isLoading={loading} disabled={disabled} onClick={onSubmit}>
        Issue TXN
      </Button>
    </StyledSubmit>
  );
};

const DetailRow = ({
  title,
  value,
  isLoading,
}: {
  title: string;
  value?: string | number;
  isLoading?: boolean;
}) => {
  return (
    <StyledDetailRow>
      <Typography>{title}</Typography>
      {isLoading ? (
        <StyledLoader width={100} height={26} />
      ) : (
        <StyledDetailsValue>{value || "-"}</StyledDetailsValue>
      )}
    </StyledDetailRow>
  );
};

const Exmaples = ({ onClick }: { onClick: (value: string) => void }) => {
  return (
    <StyledExamples>
      <Typography variant="h3">Examples</Typography>
      <StyledExamplesList>
        <Chip
          label="Frozen #1"
          onClick={() => {
            onClick("kf-kkdY_B7p-77TLn2hUhM6QidWrrsl8FYWCIvBMpZKprBtN");
          }}
        />
        <Chip
          label=" Frozen #2"
          onClick={() => {
            onClick("kf8guqdIbY6kpMykR8WFeVGbZcP2iuBagXfnQuq0rGrxgE04");
          }}
        />
        <Chip
          label="Not frozen"
          onClick={() => {
            onClick("EQDerEPTIh0O8lBdjWc6aLaJs5HYqlfBN2Ruj1lJQH_6vcaZ");
          }}
        />
      </StyledExamplesList>
    </StyledExamples>
  );
};

//----- STYLES -----//

const StyledExamples = styled(StyledFlexColumn)({
  marginBottom: 30,
  alignItems: "flex-start",
  h3: {
    fontWeight: 700,
    fontSize: 18,
    marginBottom: 10,
  },
});

const StyledExamplesList = styled(StyledFlexRow)({
  gap: 10,
  justifyContent: "flex-start",
  button: {
    background: "transparent",
    border: "unset",
    cursor: "pointer",
    padding: 0,
  },
});

const StyledSubmit = styled(StyledFlexRow)({
  marginTop: 20,
  button: {
    minWidth: 200,
  },
});

const StyledDetailsValue = styled(Typography)({
  ...textOverflow,
  fontWeight: 600,
  flex: 1,
});

const StyledInput = styled(Input)({
  maxWidth: 600,
  marginBottom: 30,
});

const StyledDetailRow = styled(StyledFlexRow)({
  justifyContent: "flex-start",
  minHeight: 40,
});

const StyledLoader = styled(Skeleton)({
  background: "rgba(0,0,0, 0.15)",
});

const StyledContainer = styled(Container)({
  alignItems: "center",
});
