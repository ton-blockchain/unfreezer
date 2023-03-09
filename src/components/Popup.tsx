import Modal from "@mui/material/Modal";
import { ReactElement } from "react";
import { styled } from "@mui/material";
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
      <StyledContainer className="children" title={title}>
        {close && <StyledCloseButton close={close} />}
        {children}
      </StyledContainer>
    </StyledModal>
  );
};

const StyledCloseButton = styled(CloseButton)({
  position:'absolute',
  top:10,
  right:10
});

const StyledContainer = styled(Container)({
  position: "relative",
  width: "fit-content",
  height: "fit-content",
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
