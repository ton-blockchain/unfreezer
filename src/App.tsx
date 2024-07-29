import { styled } from "@mui/material";
import { Navbar } from "components/Navbar";
import { StyledFlexColumn, StyledGrid } from "./styles";
import Info from "Info";
import { Unfreeze } from "Unfreeze/Unfreeze";
import { Footer } from "components";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { manifestUrl } from "./config";

function App() {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <StyledApp>
        <Navbar />
        <StyledContent>
          <Unfreeze />
          <Info />
        </StyledContent>
        <Footer />
      </StyledApp>
    </TonConnectUIProvider>
  );
}

export default App;

const StyledApp = styled(StyledFlexColumn)({
  minHeight: "100vh",
  gap: 0,
});

const StyledContent = styled(StyledGrid)({
  paddingTop: 100,
  display: "flex",
  gap: 10,
  flexDirection: "row",
  alignItems: "flex-start",
  paddingBottom: 0,
  "@media (max-width: 900px)": {
    flexDirection: "column",
    ".unfreeze": {
      width: "100%",
      order: 2,
    },
    ".info": {
      width: "100%",
      order: 1,
    },
  },
});
