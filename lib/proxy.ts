import { ProxyAgent, setGlobalDispatcher } from "undici";

// Node's global fetch ignores the OS/browser proxy. When HTTPS_PROXY (or
// HTTP_PROXY) is set — e.g. a local Clash Verge on 7897 — route all
// server-side fetch calls through it. Import this module for its side effect
// before any code that calls fetch.
const proxyUrl =
  process.env.HTTPS_PROXY ??
  process.env.https_proxy ??
  process.env.HTTP_PROXY ??
  process.env.http_proxy;

export const proxyEnabled = Boolean(proxyUrl);

if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}
