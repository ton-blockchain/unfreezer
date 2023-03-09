import { Chip, styled, Typography } from "@mui/material";
import { isDev } from "config";
import React from "react";
import { StyledFlexColumn, StyledFlexRow } from "styles";

export const Exmaple = ({ onClick }: { onClick: (value: string) => void }) => {
  if (!isDev()) return null;
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
