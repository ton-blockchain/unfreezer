import { TextField, styled, Typography } from "@mui/material";
import React from "react";
import { StyledFlexColumn } from "../styles";
import { NumericFormat } from "react-number-format";

interface Props {
  error?: string;
  onFocus?: () => void;
  type?: "text" | "password";
  className?: string;
  placeholder?: string;
  title?: string;
}
interface TextInputProps extends Props {
  value?: string;
  onChange: (value: string) => void;
}

function TextInput({
  value,
  onChange,
  error,
  onFocus,
  type = "text",
  className = "",
  placeholder,
  title,
}: TextInputProps) {
  return (
    <StyledContainer className={className}>
      {title && <Typography className="title">{title}</Typography>}
      <StyledInput
        placeholder={placeholder}
        onFocus={onFocus}
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <StyledError>{error}</StyledError>}
    </StyledContainer>
  );
}

interface NumberInputProps extends Props {
  value?: string | number;
  onChangeInteger?: (value?: number) => void;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const NumberInput = (props: NumberInputProps) => {
  return (
    <StyledContainer className={props.className}>
      {props.title && <Typography className="title">{props.title}</Typography>}

      <NumericFormat
        disabled={props.disabled}
        onFocus={props.onFocus}
        onValueChange={(values, _sourceInfo) => {
          if (_sourceInfo.source !== "event") {
            return;
          }

          props.onChange?.(values.value);
          props.onChangeInteger?.(values.floatValue);
        }}
        placeholder={props.placeholder}
        value={props.value ?? ""}
        customInput={StyledInput}
      />
      {props.error && <StyledError>{props.error}</StyledError>}
    </StyledContainer>
  );
};

const StyledInput = styled("input")(({ theme }) => ({
  borderRadius: 8,
  height: 40,
  width: "100%",
  outline: "unset",
  fontSize: 16,
  fontFamily: "inherit",
  border: `1px solid rgba(114, 138, 150, 0.4)`,
  color: theme.palette.text.primary,
  textIndent: 12,
  "&::placeholder": {
    transition: "0.2s all",
    opacity: 0.7,
  },
  "&:focus": {
    "&::placeholder": {
      color: "transparent",
    },
  },
}));

export { TextInput, NumberInput };

const StyledContainer = styled(StyledFlexColumn)({
  gap: 2,
  ".title": {
    fontSize: 16,
    textAlign: "left",
    width: "100%",
    fontWeight: 600,
    marginBottom: 8,
  },
  ".MuiTextField-root": {
    width: "100%",
    fieldset: {
      borderRadius: 10,
    },
    input: {
      fontSize: 16,
      fontWeight: 500,
    },
  },
});

const StyledError = styled(Typography)({
  fontSize: 14,
  color: "red",
  textAlign: "left",
  width: "100%",
  paddingLeft: 10,
});
