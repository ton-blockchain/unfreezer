import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material";
import { theme } from "theme";
import { globalStyles } from "styles";
import { SnackbarProvider } from "notistack";
import App from "App";
import { analytics } from "analytics";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
analytics.init();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      cacheTime: Infinity,
    },
  },
});

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <SnackbarProvider
        maxSnack={3}
        classes={{
          variantSuccess: "snackbar-success",
          variantError: "snackbar-error",
        }}
      >
        <RouterProvider router={router} />
      </SnackbarProvider>
    </ThemeProvider>

    <ReactQueryDevtools />
  </QueryClientProvider>
);
