import Modal from "@mui/material/Modal";
import { ReactElement } from "react";
import { Box, styled } from "@mui/material";
import { CloseButton } from "./CloseButton";
import { Container } from "./Container";
interface Props {
  children: ReactElement;
  close?: () => void;
  open: boolean;
  className?: string;
  title?: string;
}

export const Popup = ({
  children,
  close,
  open,
  className = "",
  title,
}: Props) => {
  return (
    <StyledModal open={open} onClose={close} className={className}>
      <StyledModalChildren className="content">
        <StyledContainer title={title} className="children">
          {close && <StyledCloseButton close={close} />}
          {children}
        </StyledContainer>
      </StyledModalChildren>
    </StyledModal>
  );
};

const StyledCloseButton = styled(CloseButton)({
  position: "absolute",
  top: 10,
  right: 10,
});
const StyledModalChildren = styled(Box)({
  width: "fit-content",
  height: "fit-content",
});

const StyledContainer = styled(Container)({
  position: "relative",

  outline: "unset",
  padding: 20,
  paddingTop: 50,
});

const StyledModal = styled(Modal)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  outline: "unset",
  border: "unset",
});
