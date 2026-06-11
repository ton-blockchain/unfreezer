import { useState, useEffect, useCallback } from "react";

interface Route {
  isTestnet: boolean;
  address: string | null;
}

function parseRoute(): Route {
  const params = new URLSearchParams(window.location.search);
  const isTestnet = params.get("testnet") === "true";
  const address = params.get("address") || null;
  return { isTestnet, address };
}

function buildUrl(testnet: boolean, address?: string | null) {
  const params = new URLSearchParams();
  if (testnet) params.set("testnet", "true");
  if (address) params.set("address", address);
  const search = params.toString();
  return search ? `/?${search}` : "/";
}

function push(url: string) {
  if (window.location.pathname + window.location.search !== url) {
    history.pushState(null, "", url);
    window.dispatchEvent(new Event("routechange"));
  }
}

function replace(url: string) {
  if (window.location.pathname + window.location.search !== url) {
    history.replaceState(null, "", url);
    window.dispatchEvent(new Event("routechange"));
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseRoute);

  useEffect(() => {
    const update = () => setRoute(parseRoute());
    window.addEventListener("popstate", update);
    window.addEventListener("routechange", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("routechange", update);
    };
  }, []);

  const setTestnet = useCallback((testnet: boolean) => {
    push(buildUrl(testnet, route.address));
  }, [route.address]);

  const setAddress = useCallback((address: string) => {
    replace(buildUrl(route.isTestnet, address));
  }, [route.isTestnet]);

  return {
    network: (route.isTestnet ? "testnet" : "mainnet") as "mainnet" | "testnet",
    address: route.address,
    setTestnet,
    setAddress,
  };
}
