import { Box, Skeleton, styled } from "@mui/material";
import { Button, NumberInput, TextInput, Popup, Container } from "components";
import { StyledFlexRow, textOverflow, StyledFlexColumn } from "../styles";

export const StyledSubmit = styled(StyledFlexRow)({
  marginTop: 20,
  button: {
    minWidth: 200,
  },
});

export const StyledDetailsValue = styled(Box)({
  ...textOverflow,
  fontWeight: 600,
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 20,
});

export const StyledContractAddressInput = styled(TextInput)({
  maxWidth: 600,
  marginBottom: 20,
});

export const StyledDetailRow = styled(StyledFlexRow)({
  justifyContent: "flex-start",
  gap: 12,
});

export const StyledLoader = styled(Skeleton)({
  background: "rgba(0,0,0, 0.15)",
});

export const StyledContainer = styled(StyledFlexColumn)({
  alignItems: "center",
  flex: 1,
  width: "unset",
});

export const StyledUnfreezePopup = styled(Popup)({
  ".content": {
    width: "100%",
    maxWidth: 450,
  },
});

export const StyledAmountInput = styled(NumberInput)({
  maxWidth: 120,
  height: 32,
  input: {
    textAlign: "center",
    textIndent: "0px",
  },
});

export const StyledChangeButton = styled(Button)({
  "*": {
    fontSize: 14,
  },
});

export const StyledUnfreezeDetails = styled(Container)<{ disabled: boolean }>(
  ({ disabled }) => ({
    ".children": {
      pointerEvents: disabled ? "none" : "unset",
      opacity: disabled ? 0.7 : 1,
    },
  })
);
