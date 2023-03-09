import * as React from "react";
import Tooltip from "@mui/material/Tooltip";
import {
  ClickAwayListener,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Box } from "@mui/system";
export function AppTooltip({
  children,
  text,
  style = {},
}: {
  children: React.ReactNode;
  text: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = React.useState(false);

  const isMobile = useMediaQuery("(max-width:600px)");

  if (!text) return <>{children}</>;

  if (isMobile) {
    return (
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <StyledTooltip
          open={open}
          onClick={() => setOpen(true)}
          arrow={true}
          title={<StyledTitle>{text}</StyledTitle>}
        >
          <StyledContent style={style} className="tooltip-children">
            {children}
          </StyledContent>
        </StyledTooltip>
      </ClickAwayListener>
    );
  }

  return (
    <StyledTooltip arrow={true} title={<StyledTitle>{text}</StyledTitle>}>
      <StyledContent style={style} className="tooltip-children">
        {children}
      </StyledContent>
    </StyledTooltip>
  );
}

const StyledContent = styled(Box)({});

const StyledTitle = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: "rgb(114, 138, 150)",
});

const StyledTooltip = styled(Tooltip)({});
