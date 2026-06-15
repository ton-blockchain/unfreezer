import { useState, useEffect, createContext, useContext } from "react";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import { THEME } from "@tonconnect/ui-react";
import { Snowflake, Sun, Moon, ChevronDown, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu.tsx";
import { UnfreezePage } from "./pages/UnfreezePage.tsx";
import { useRouter } from "./lib/router.ts";

type Theme = "dark" | "light";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function App() {
  const { network, address, setTestnet, setAddress } = useRouter();
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("unf-theme");
    return saved === "light" ? "light" : "dark";
  });
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("unf-theme", theme);
    tonConnectUI.uiOptions = {
      uiPreferences: {
        theme: theme === "light" ? THEME.LIGHT : THEME.DARK,
      },
    };
  }, [theme, tonConnectUI]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div className="min-h-full flex flex-col">
        <header className="flex items-center gap-2.5 px-7 h-[60px] bg-[#08080A] border-b border-white/6 sticky top-0 z-50 dark:bg-[#08080A] max-sm:px-4 max-sm:h-auto max-sm:flex-wrap max-sm:py-3" style={{ background: theme === "light" ? "#fff" : "#08080A", borderBottomColor: theme === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5 text-[17px] font-bold mr-auto max-sm:text-[15px]">
            <div className="w-8 h-8 bg-[#0098EA] rounded-[9px] flex items-center justify-center text-white max-sm:w-7 max-sm:h-7 max-sm:rounded-[7px]">
              <Snowflake className="size-4 max-sm:size-3.5" />
            </div>
            TON Unfreezer
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full size-10 shrink-0 max-sm:size-9"
            style={{ background: theme === "light" ? "#F0F1F3" : "#19191B", color: theme === "light" ? "var(--foreground)" : "#fff" }}
            onClick={toggle}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>
          <div className="flex items-center gap-2.5 max-sm:w-full max-sm:justify-between">
            <NetworkDropdown network={network} setTestnet={setTestnet} theme={theme} />
            <TonConnectButton />
          </div>
        </header>

        <main className="flex-1 max-w-[960px] w-full mx-auto px-6 pt-9 pb-15 max-sm:px-4 max-sm:pt-6 max-sm:pb-12">
          <UnfreezePage network={network} initialAddress={address} onAddressChange={setAddress} />
        </main>

        <footer
          className="flex items-center justify-center gap-3 px-7 h-[52px] border-t text-[14px] text-muted-foreground max-sm:px-4"
          style={{ borderTopColor: theme === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }}
        >
          <span>
            Created by{" "}
            <a
              href="https://t.me/toncore"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#0098EA] hover:underline"
            >
              TON Core
            </a>
          </span>
          <a
            href="https://github.com/ton-blockchain/unfreezer"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Repository"
            aria-label="View source code on GitHub"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </a>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
}

function NetworkDropdown({ network, setTestnet, theme }: {
  network: "mainnet" | "testnet";
  setTestnet: (testnet: boolean) => void;
  theme: Theme;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-full h-10 px-3 gap-1.5 text-[15px] font-bold max-sm:h-9 max-sm:text-sm max-sm:px-2.5"
          style={{ background: theme === "light" ? "#F0F1F3" : "#19191B", color: theme === "light" ? "var(--foreground)" : "#fff" }}
        >
          <Circle className="size-2 fill-current" style={{ color: network === "testnet" ? "var(--warning)" : "var(--success)" }} />
          {network === "mainnet" ? "Mainnet" : "Testnet"}
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] rounded-xl p-2">
        <DropdownMenuItem
          className="rounded-xl px-3.5 py-3 text-[15px] font-medium gap-2.5 cursor-pointer"
          onClick={() => setTestnet(false)}
        >
          <Circle className="size-2 fill-current" style={{ color: "var(--success)" }} />
          Mainnet
          {network === "mainnet" && <Check className="size-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-xl px-3.5 py-3 text-[15px] font-medium gap-2.5 cursor-pointer"
          onClick={() => setTestnet(true)}
        >
          <Circle className="size-2 fill-current" style={{ color: "var(--warning)" }} />
          Testnet
          {network === "testnet" && <Check className="size-4 ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default App;
