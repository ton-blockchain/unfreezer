import { SxProps, Typography } from "@mui/material";
import {
  AppTooltip,
  Button,
  ConnectButton,
  NumberDisplay,
  NumberInput,
} from "components";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { IoWarning } from "react-icons/io5";
import { useConnectionStore } from "store";
import { StyledFlexColumn, StyledFlexRow, textOverflow } from "../styles";
import {
  StyledAmountInput,
  StyledSubmit,
  StyledDetailRow,
  StyledLoader,
  StyledDetailsValue,
  StyledChangeButton,
  StyledUnfreezePopup,
} from "./styles";

export const ExpectedStateInit = ({
  isLoading,
  error,
  stateInitHash,
}: {
  isLoading: boolean;
  error?: string;
  stateInitHash?: string;
}) => {
  const status = useMemo(() => {
    if (stateInitHash && !error) {
      return (
        <BsFillCheckCircleFill
          color="green"
          style={{ minWidth: 22, minHeight: 22 }}
        />
      );
    }
    if (!!error) {
      return (
        <AppTooltip text={error}>
          <IoWarning color="red" style={{ minWidth: 22, minHeight: 22 }} />
        </AppTooltip>
      );
    }
    return null;
  }, [stateInitHash, error]);

  return (
    <DetailRow isLoading={isLoading} title="State init hash at block:">
      <StyledFlexRow gap={10} justifyContent="flex-start">
        <AppTooltip style={textOverflow} text={stateInitHash}>
          <Typography style={textOverflow}>{stateInitHash || "-"}</Typography>
        </AppTooltip>
        {status}
      </StyledFlexRow>
    </DetailRow>
  );
};

export const AmountToRevive = ({
  isLoading,
  value,
}: {
  isLoading: boolean;
  value?: number;
}) => {
  // TODO add tooltip
  return (
    <DetailRow isLoading={isLoading} title="Amount to revive:">
      <StyledFlexRow justifyContent="flex-start">
        <StyledAmountInput value={value} disabled />
        <Typography>TON</Typography>
      </StyledFlexRow>
    </DetailRow>
  );
};

export const MonthsInput = ({
  isLoading,
  onChange,
  value,
  pricePerMonth,
}: {
  isLoading: boolean;
  onChange: (value?: number) => void;
  value?: number;
  pricePerMonth: number;
}) => {
  return (
    <DetailRow
      isLoading={isLoading}
      title="Months to add rent:"
      sx={{ alignItems: "flex-start" }}
    >
      <StyledFlexColumn>
        <StyledFlexRow justifyContent="flex-start">
          <StyledAmountInput value={value} onChangeInteger={onChange} />
        </StyledFlexRow>
        <StyledFlexRow
          sx={{ fontSize: 12, mt: -0.5 }}
          justifyContent="flex-start"
        >
          Rent per month:{" "}
          <NumberDisplay value={pricePerMonth} decimalScale={3} />
          TON
        </StyledFlexRow>
      </StyledFlexColumn>
    </DetailRow>
  );
};

export const TotalAmount = ({
  isLoading,
  value,
}: {
  isLoading: boolean;
  value?: number;
}) => {
  // TODO add tooltip
  return (
    <DetailRow isLoading={isLoading} title="Total amount:">
      <StyledFlexRow justifyContent="flex-start">
        <NumberDisplay value={value} decimalScale={3} /> TON
      </StyledFlexRow>
    </DetailRow>
  );
};

export const ActionButton = ({
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
        Unfreeze
      </Button>
    </StyledSubmit>
  );
};

export const DetailRow = ({
  title,
  children,
  isLoading,
  sx,
}: {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  sx?: SxProps;
}) => {
  return (
    <StyledDetailRow sx={sx}>
      <Typography>{title}</Typography>
      {isLoading ? (
        <StyledLoader width={100} height={20} />
      ) : (
        <StyledDetailsValue>{children || "-"}</StyledDetailsValue>
      )}
    </StyledDetailRow>
  );
};

export const UnfreezeBlock = ({
  initialUnfreezeBlock,
  unfreezeBlock,
  onSubmit,
  isLoading,
}: {
  initialUnfreezeBlock?: number;
  unfreezeBlock?: number;
  onSubmit: (value: number | undefined) => void;
  isLoading: boolean;
}) => {
  const [showUnfreeze, setShowUnfreeze] = useState(false);
  const [value, setValue] = useState<number | undefined>();
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    setValue(unfreezeBlock);
  }, [unfreezeBlock, open]);

  const validateAndSubmit = () => {
    const isValid = !!value;

    if (!isValid || !value) {
      setError(true);
      return;
    }
    onSubmit(value);
    setShowUnfreeze(false);
  };

  return (
    <>
      <StyledUnfreezePopup
        open={showUnfreeze}
        close={() => setShowUnfreeze(false)}
        title="Modify unfreeze block"
      >
        <StyledFlexColumn gap={30}>
          <NumberInput
            onFocus={() => setError(false)}
            placeholder="Block number"
            value={value}
            onChangeInteger={setValue}
            error={error ? "Invalid block number" : undefined}
          />
          <Button
            style={{ minWidth: 150 }}
            onClick={validateAndSubmit}
            disabled={!value}
          >
            Submit
          </Button>
        </StyledFlexColumn>
      </StyledUnfreezePopup>
      <DetailRow isLoading={isLoading} title="Unfreeze block:">
        <Typography> {unfreezeBlock || "-"}</Typography>
        {!unfreezeBlock && (
          <StyledChangeButton
            transparent={true}
            onClick={() => setShowUnfreeze(true)}
          >
            Set
          </StyledChangeButton>
        )}
        {unfreezeBlock && unfreezeBlock !== initialUnfreezeBlock && (
          <StyledChangeButton
            transparent={true}
            onClick={() => {
              onSubmit(initialUnfreezeBlock);
              setShowUnfreeze(false);
            }}
          >
            Reset
          </StyledChangeButton>
        )}
      </DetailRow>
    </>
  );
};

export const LatestStateInit = ({
  isLoading,
  stateInitHashToMatch,
}: {
  isLoading: boolean;
  stateInitHashToMatch?: string;
}) => {
  return (
    <DetailRow isLoading={isLoading} title="Latest state init hash:">
      <AppTooltip style={textOverflow} text={stateInitHashToMatch}>
        <Typography style={textOverflow}>
          {stateInitHashToMatch || "-"}
        </Typography>
      </AppTooltip>
    </DetailRow>
  );
};

export const Balance = ({
  isLoading,
  balance,
}: {
  isLoading: boolean;
  balance?: string;
}) => {
  return (
    <DetailRow isLoading={isLoading} title="Balance:">
      {balance ? (
        <Typography>
          <NumberDisplay value={balance} decimalScale={3} /> TON
        </Typography>
      ) : (
        <Typography>{"-"}</Typography>
      )}
    </DetailRow>
  );
};
