import { Typography } from "@mui/material";
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
import { StyledFlexColumn, StyledFlexRow, textOverflow } from "styles";
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
  stateInitHashToMatch,
  stateInitHash,
}: {
  isLoading: boolean;
  stateInitHashToMatch?: string;
  stateInitHash?: string;
}) => {
  const status = useMemo(() => {
    if (!stateInitHash && !stateInitHashToMatch) {
      return null;
    }
    if (stateInitHash === stateInitHashToMatch) {
      return (
        <AppTooltip text="all good">
          <BsFillCheckCircleFill color="green" size={22} />
        </AppTooltip>
      );
    }
    return (
      <AppTooltip text="some warning">
        <IoWarning color="red" size={22} />
      </AppTooltip>
    );
  }, [stateInitHash, stateInitHashToMatch]);

  return (
    <DetailRow isLoading={isLoading} title="State init at block:">
      <StyledFlexRow gap={10} justifyContent="flex-start">
        <AppTooltip style={textOverflow} text={stateInitHashToMatch}>
          <Typography style={textOverflow}>
            {stateInitHashToMatch || "-"}
          </Typography>
        </AppTooltip>
        {status}
      </StyledFlexRow>
    </DetailRow>
  );
};

export const AmountToSend = ({
  isLoading,
  onChange,
  value,
}: {
  isLoading: boolean;
  onChange: (value?: number) => void;
  value?: number;
}) => {
  return (
    <DetailRow isLoading={isLoading} title="Amount to send:">
      <StyledFlexRow justifyContent="flex-start">
        <StyledAmountInput
          placeholder="Amount"
          value={value}
          onChangeInteger={onChange}
        />
        <Typography>TON</Typography>
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
}: {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
}) => {
  return (
    <StyledDetailRow>
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
  unfreezeBlock,
  onSubmit,
  isLoading,
}: {
  unfreezeBlock?: number;
  onSubmit: (value: number) => void;
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
    const isValid = value?.toString().length === 8;
    console.log({ isValid });

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
        {!!unfreezeBlock && (
          <StyledChangeButton
            transparent={true}
            onClick={() => setShowUnfreeze(true)}
          >
            Change
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
