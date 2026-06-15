import { useState, useEffect, useCallback } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { Address, toNano } from "@ton/core";
import {
  AlertCircle,
  Info,
  CheckCircle2,
  Download,
  CheckCircle,
  CircleAlert,
  Snowflake,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Alert, AlertTitle } from "@/components/ui/alert.tsx";
import { useTheme } from "../App.tsx";
import {
  fetchAccountDetails,
  getStateForUnfreeze,
  type AccountDetails,
  type StateForUnfreeze,
  type ProgressCallback,
} from "../lib/unfreeze/index.ts";

interface Props {
  network: "mainnet" | "testnet";
  initialAddress: string | null;
  onAddressChange: (address: string) => void;
}

export function UnfreezePage({ network, initialAddress, onAddressChange }: Props) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const isConnected = !!wallet;

  const [address, setAddress] = useState(initialAddress || "");
  const [months, setMonths] = useState(12);

  const [accountLoading, setAccountLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);

  const [stateLoading, setStateLoading] = useState(false);
  const [stateData, setStateData] = useState<StateForUnfreeze | null>(null);

  const [unfreezeLoading, setUnfreezeLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Progress modal state
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressDetail, setProgressDetail] = useState("");

  const onProgress: ProgressCallback = useCallback((step: string, detail?: string) => {
    setProgressStep(step);
    setProgressDetail(detail || "");
  }, []);

  const isValidAddress = useCallback((addr: string) => {
    try {
      Address.parse(addr);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loadAccount = useCallback(async () => {
    if (!address.trim() || !isValidAddress(address.trim())) {
      setStatus({ type: "error", message: "Enter a valid TON address" });
      return;
    }

    setAccountLoading(true);
    setAccountDetails(null);
    setStateData(null);
    setStatus(null);
    setProgressVisible(true);

    try {
      onAddressChange(address.trim());
      const details = await fetchAccountDetails(address.trim(), network, onProgress);
      setAccountDetails(details);

      if (details && details.isFrozen && details.unfreezeBlock) {
        setStateLoading(true);
        try {
          const state = await getStateForUnfreeze({
            address: address.trim(),
            network,
            unfreezeBlock: details.unfreezeBlock,
            stateInitHashToMatch: details.stateInitHashToMatch,
            freezeTx: details.freezeTx,
            onProgress,
          });
          setStateData(state);
        } finally {
          setStateLoading(false);
        }
      } else if (details && details.isFrozen) {
        setStatus({ type: "error", message: "Could not locate the freeze transaction for this account" });
      } else if (details && !details.isFrozen) {
        setStatus({ type: "info", message: "This account is not frozen" });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || "Failed to fetch account details" });
    } finally {
      setAccountLoading(false);
      setProgressVisible(false);
    }
  }, [address, network, isValidAddress, onAddressChange, onProgress]);

  useEffect(() => {
    if (initialAddress && isValidAddress(initialAddress)) {
      setAddress(initialAddress);
    }
  }, [initialAddress, isValidAddress]);

  const totalAmount = accountDetails
    ? (parseFloat(accountDetails.minAmountToSend || "0") + months * parseFloat(accountDetails.pricePerMonth || "0"))
    : 0;

  const handleUnfreeze = async () => {
    if (!isConnected) {
      tonConnectUI.openModal();
      return;
    }

    if (!stateData || stateData.error) return;

    setUnfreezeLoading(true);
    setStatus({ type: "info", message: "Confirm the transaction in your wallet..." });

    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        network: network === "mainnet" ? "-239" : "-3",
        messages: [{
          address: address.trim(),
          amount: toNano(totalAmount.toFixed(9)).toString(),
          stateInit: stateData.stateInitBoc,
        }],
      });
      setStatus({ type: "success", message: "Unfreeze transaction sent! Waiting for confirmation..." });
    } catch (err: any) {
      const msg = err?.message || String(err) || "";
      if (msg.includes("Interrupted") || msg.includes("cancel") || msg.includes("reject") || msg.includes("Cancelled") || msg.includes("closed")) {
        setStatus({ type: "error", message: "Transaction cancelled" });
      } else {
        setStatus({ type: "error", message: msg || "Unfreeze failed" });
      }
    } finally {
      setUnfreezeLoading(false);
    }
  };

  const handleDownloadStateInit = () => {
    if (!stateData?.stateInitBoc) return;
    const blob = new Blob(
      [Buffer.from(stateData.stateInitBoc, "base64")],
      { type: "application/octet-stream" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stateinit_${address.trim().slice(0, 12)}.boc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isFrozen = accountDetails?.isFrozen ?? false;
  const hasState = !!stateData?.stateInitHash && !stateData?.error;
  const hashesMatch = stateData?.stateInitHash && accountDetails?.stateInitHashToMatch
    && stateData.stateInitHash === accountDetails.stateInitHashToMatch;

  return (
    <>
      <ProgressModal
        visible={progressVisible}
        step={progressStep}
        detail={progressDetail}
      />

      <div className="grid grid-cols-[1fr_320px] gap-5 items-start max-md:grid-cols-1">
        <div className="space-y-4.5">
          {/* Contract Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Contract To Unfreeze</CardTitle>
              <CardDescription>
                Enter the address of a frozen contract on {network === "mainnet" ? "TON Mainnet" : "TON Testnet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Contract Address
                  </Label>
                  <div className="flex gap-2.5">
                    <Input
                      placeholder="EQC..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={accountLoading}
                      onKeyDown={(e) => e.key === "Enter" && loadAccount()}
                      className="font-mono text-[13px]"
                    />
                    <Button
                      onClick={loadAccount}
                      disabled={accountLoading || !address.trim()}
                      className="rounded-full px-5"
                    >
                      {accountLoading ? <span className="spinner" /> : null}
                      Load
                    </Button>
                  </div>
                </div>

                {accountDetails && (
                  <div className="space-y-2.5 pt-2">
                    <DetailRow label="Balance" loading={accountLoading}>
                      {accountDetails.balance ? `${accountDetails.balance} TON` : "-"}
                    </DetailRow>
                    <DetailRow label="Status" loading={accountLoading}>
                      <StatusBadge state={accountDetails.accountState} />
                    </DetailRow>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Unfreeze Details Card */}
          <Card className={!isFrozen && accountDetails ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Unfreeze Details</CardTitle>
              <CardDescription>
                Configure unfreeze parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DetailRow label="Amount to revive" loading={accountLoading}>
                  <span className="font-mono text-[13px]">
                    {accountDetails?.minAmountToSend
                      ? `${parseFloat(accountDetails.minAmountToSend).toFixed(4)} TON`
                      : "-"}
                  </span>
                </DetailRow>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Months to add rent
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={months}
                      onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
                      disabled={accountLoading || !isFrozen}
                      className="w-24 font-mono"
                    />
                    <span className="text-xs text-muted-foreground">
                      Rent per month: <span className="font-mono">{accountDetails?.pricePerMonth ? `${parseFloat(accountDetails.pricePerMonth).toFixed(4)} TON` : "-"}</span>
                    </span>
                  </div>
                </div>

                <DetailRow label="Total amount" loading={accountLoading}>
                  <span className="font-mono text-[13px] font-semibold">
                    {accountDetails ? `${totalAmount.toFixed(4)} TON` : "-"}
                  </span>
                </DetailRow>

                <Separator />

                <DetailRow label="Unfreeze block" loading={accountLoading || stateLoading}>
                  <span className="font-mono text-[13px]">
                    {accountDetails?.unfreezeBlock ?? "-"}
                  </span>
                </DetailRow>

                <DetailRow label="StateInit hash (blockchain)" loading={accountLoading}>
                  <span className="font-mono text-[13px] truncate max-w-[240px]" title={accountDetails?.stateInitHashToMatch ?? undefined}>
                    {accountDetails?.stateInitHashToMatch || "-"}
                  </span>
                </DetailRow>

                <DetailRow label="StateInit hash (unfreezer)" loading={accountLoading || stateLoading}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[13px] truncate max-w-[200px]" title={stateData?.stateInitHash || undefined}>
                      {stateData?.stateInitHash || "-"}
                    </span>
                    {hashesMatch && (
                      <CheckCircle className="size-4 shrink-0" style={{ color: "var(--success)" }} />
                    )}
                    {stateData?.stateInitHash && !hashesMatch && (
                      <CircleAlert className="size-4 shrink-0 text-destructive" />
                    )}
                  </div>
                </DetailRow>

                {stateData?.error && (
                  <StatusAlert type="error" message={stateData.error} />
                )}

                <DetailRow label="Size" loading={stateLoading}>
                  <span className="font-mono text-[13px]">
                    {stateData?.sizeBytes
                      ? `${(stateData.sizeBytes / 1024).toFixed(2)} KB`
                      : "-"}
                  </span>
                </DetailRow>

                {stateData?.stateInitBoc && (
                  <>
                    <Separator />
                    <div className="flex gap-2.5">
                      <Button
                        variant="secondary"
                        className="rounded-full h-10 gap-2"
                        onClick={handleDownloadStateInit}
                      >
                        <Download className="size-4" />
                        Download StateInit BOC
                      </Button>
                    </div>
                  </>
                )}

                <Separator />

                <Button
                  className="w-full h-12 rounded-full text-[15px] font-bold"
                  disabled={unfreezeLoading || (!!accountDetails && (!hasState || !!stateData?.error))}
                  onClick={handleUnfreeze}
                >
                  {unfreezeLoading ? (
                    <><span className="spinner" /> Unfreezing...</>
                  ) : !isConnected ? (
                    "Connect Wallet to Unfreeze"
                  ) : (
                    "Unfreeze"
                  )}
                </Button>
              </div>

              {status && (
                <StatusAlert type={status.type} message={status.message} className="mt-4" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column -- info card */}
        <UnfreezeInfoCard
          network={network}
          accountDetails={accountDetails}
          stateData={stateData}
        />
      </div>
    </>
  );
}

// ─── Progress Modal (TonConnect-style) ───

function ProgressModal({ visible, step, detail }: {
  visible: boolean;
  step: string;
  detail: string;
}) {
  const { theme } = useTheme();

  if (!visible) return null;

  const bg = theme === "dark" ? "#1A1A1E" : "#FFFFFF";
  const border = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const text = theme === "dark" ? "#F0F0F3" : "#1A1A1E";
  const muted = theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.56)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-[380px] rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-5"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        {/* Spinner */}
        <div className="relative size-16 flex items-center justify-center">
          <svg className="absolute inset-0 size-16 animate-[spin_1.2s_linear_infinite]" viewBox="0 0 64 64">
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="#0098EA"
              strokeWidth="4"
              strokeDasharray="120 60"
              strokeLinecap="round"
            />
          </svg>
          <Snowflake className="size-6" style={{ color: "#0098EA" }} />
        </div>

        {/* Step */}
        <div className="text-center space-y-1.5">
          <div className="text-[15px] font-semibold" style={{ color: text }}>
            {step || "Loading..."}
          </div>
          {detail && (
            <div className="text-[13px] font-mono" style={{ color: muted }}>
              {detail}
            </div>
          )}
        </div>

        {/* Subtle note */}
        <div className="text-[12px] text-center leading-relaxed" style={{ color: muted }}>
          This may take a while for contracts with many post-freeze transactions
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ───

function DetailRow({ label, loading, children }: {
  label: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      {loading ? (
        <div className="skeleton h-4 w-24" />
      ) : (
        <span className="text-right max-w-[65%] truncate">{children}</span>
      )}
    </div>
  );
}

function StatusBadge({ state }: { state: string }) {
  if (state === "frozen") {
    return (
      <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider border-blue-500/20 text-blue-500 bg-blue-500/10">
        <span className="size-1.5 rounded-full bg-blue-500" />
        Frozen
      </Badge>
    );
  }
  if (state === "active") {
    return (
      <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider border-[var(--success)]/20 text-[var(--success)] bg-[var(--success)]/10">
        <span className="size-1.5 rounded-full" style={{ background: "var(--success)" }} />
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider border-[var(--warning)]/20 text-[var(--warning)] bg-[var(--warning)]/10">
      <span className="size-1.5 rounded-full" style={{ background: "var(--warning)" }} />
      {state || "Unknown"}
    </Badge>
  );
}

function StatusAlert({ type, message, className }: { type: string; message: string; className?: string }) {
  const variant = type === "error" ? "destructive" : type === "success" ? "success" : "info";
  const Icon = type === "error" ? AlertCircle : type === "success" ? CheckCircle2 : Info;
  return (
    <Alert variant={variant} className={className}>
      <Icon className="size-4" />
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  );
}

function UnfreezeInfoCard({ network, accountDetails, stateData }: {
  network: "mainnet" | "testnet";
  accountDetails: AccountDetails | null;
  stateData: StateForUnfreeze | null;
}) {
  const hashesMatch = stateData?.stateInitHash && accountDetails?.stateInitHashToMatch
    && stateData.stateInitHash === accountDetails.stateInitHashToMatch;

  return (
    <Card className="sticky top-20 max-md:static max-md:order-[-1]">
      <CardContent className="space-y-0">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="size-14 bg-[#0098EA] rounded-full flex items-center justify-center text-white">
            <Snowflake className="size-7" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold tracking-tight">TON Unfreezer</div>
            <div className="font-mono text-[13px] font-semibold text-[#0098EA]">Revive frozen contracts</div>
          </div>
        </div>

        <Separator className="my-4" />

        <PreviewRow label="Network" value={network === "mainnet" ? "Mainnet" : "Testnet"} />
        <PreviewRow
          label="Account"
          value={accountDetails?.accountState || "N/A"}
          valueClassName={accountDetails?.isFrozen ? "text-blue-500" : accountDetails?.accountState === "active" ? "text-[var(--success)]" : ""}
        />
        <PreviewRow
          label="Hash match"
          value={!stateData ? "N/A" : hashesMatch ? "OK" : "MISMATCH"}
          valueClassName={hashesMatch ? "text-[var(--success)]" : stateData?.stateInitHash ? "text-destructive" : ""}
        />
        <PreviewRow
          label="State size"
          value={stateData?.sizeBytes ? `${(stateData.sizeBytes / 1024).toFixed(2)} KB` : "N/A"}
        />

        <Separator className="my-4" />

        <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>Smart contracts in TON pay rent for storage. When a contract runs out of funds, it freezes and its code/data cells are deleted.</p>
          <p>This tool finds the original state of the frozen contract and sends a special message to restore it.</p>
        </div>

        <NetworkBadge network={network} />
      </CardContent>
    </Card>
  );
}

function PreviewRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`font-mono text-[13px] font-semibold text-right max-w-[65%] truncate ${valueClassName || ""}`}>{value}</span>
    </div>
  );
}

function NetworkBadge({ network }: { network: "mainnet" | "testnet" }) {
  return (
    <Badge
      variant="outline"
      className={`mt-4 gap-1.5 py-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider ${
        network === "mainnet"
          ? "border-[var(--success)]/20 text-[var(--success)] bg-[var(--success)]/10"
          : "border-[var(--warning)]/20 text-[var(--warning)] bg-[var(--warning)]/10"
      }`}
    >
      <span className="size-1.5 rounded-full" style={{ background: network === "mainnet" ? "var(--success)" : "var(--warning)" }} />
      {network === "mainnet" ? "Mainnet" : "Testnet"}
    </Badge>
  );
}
