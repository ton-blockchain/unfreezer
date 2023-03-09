import {
  ClickAwayListener,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Box } from "@mui/system";
import { Button, ConnectButton, Github } from "components";
import { StyledFlexRow, StyledGrid } from "styles";
import { makeElipsisAddress } from "utils";
import { useState } from "react";
import LogoImg from "assets/logo.svg";
import { IoLogOutOutline } from "react-icons/io5";
import { useResetConnection } from "connection";
import { useConnectionStore } from "store";

export function Navbar() {
  const mobile = useMediaQuery("(max-width:600px)");
  return (
    <StyledContainer>
      <StyledGrid>
        <StyledFlexRow justifyContent="space-between" width="100%">
          <StyledLogo onClick={() => window.scrollTo(0, 0)}>
            <img src={LogoImg} />
            <Typography>Unfreeze</Typography>
          </StyledLogo>
          <StyledFlexRow style={{ width: "fit-content" }}>
            <ConnectSection />
            {!mobile && <Github />}
          </StyledFlexRow>
        </StyledFlexRow>
      </StyledGrid>
    </StyledContainer>
  );
}

const ConnectSection = () => {
  const address = useConnectionStore().address;

  if (!address) {
    return <ConnectButton />;
  }

  return <Connected />;
};

const Connected = () => {
  const address = useConnectionStore().address;
  const [showLogout, setShowLogout] = useState(false);
  const resetConnection = useResetConnection();

  const logout = () => {
    resetConnection();
    setShowLogout(false);
  };

  return (
    <ClickAwayListener onClickAway={() => setShowLogout(false)}>
      <StyledConnected>
        <StyledConnectedButton onClick={() => setShowLogout(true)}>
          {makeElipsisAddress(address!, 6)}
        </StyledConnectedButton>
        {showLogout && (
          <StyledDisconect onClick={logout}>
            <IoLogOutOutline />
            <Typography>Logout</Typography>
          </StyledDisconect>
        )}
      </StyledConnected>
    </ClickAwayListener>
  );
};

const StyledDisconect = styled(Button)({
  position: "absolute",
  top: "calc(100% + 10px)",
  left: "50%",
  transform: "translate(-50%)",
  width: "100%",
});

const StyledConnected = styled(Box)({
  position: "relative",
});
const StyledConnectedButton = styled(Button)({
  "*": {
    fontSize: 14,
  },
});

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
