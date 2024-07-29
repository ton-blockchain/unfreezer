import { styled, Typography, useMediaQuery } from "@mui/material";
import { Github } from "components";
import { StyledFlexRow, StyledGrid } from "../styles";
import LogoImg from "assets/logo.svg";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";

export function Navbar() {
  const mobile = useMediaQuery("(max-width:600px)");
  return (
    <StyledContainer>
      <StyledGrid>
        <StyledFlexRow justifyContent="space-between" width="100%">
          <StyledLogo onClick={() => window.scrollTo(0, 0)}>
            <img src={LogoImg} />
            <Typography>Unfreezer</Typography>
          </StyledLogo>
          <StyledFlexRow style={{ width: "fit-content" }}>
            <TonConnectButton />
            {!mobile && <Github />}
          </StyledFlexRow>
        </StyledFlexRow>
      </StyledGrid>
    </StyledContainer>
  );
}
const StyledLogo = styled("button")(({ theme }) => ({
  background: "transparent",
  border: "unset",
  cursor: "pointer",
  display: "flex",
  alignItems: "flex-end",
  margin: 0,
  padding: 0,
  gap: 7,
  p: {
    fontWeight: 700,
    position: "relative",
    color: theme.palette.text.secondary,
    fontSize: 17,
    top: -3,
  },
  img: {
    height: 33,
  },
}));

const StyledContainer = styled(StyledFlexRow)({
  width: "100%",
  background: "white",
  height: 70,
  position: "fixed",
  left: "50%",
  transform: "translate(-50%)",
  top: 0,
  zIndex: 10,
});
