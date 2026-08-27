import "server-only";

import { ProxyAgent, setGlobalDispatcher } from "undici";

// Node 的 fetch 不会自动读取系统代理。配置代理时，让所有服务端 HTTP
// 请求（外部目录与 Neon HTTP 查询）共用同一 dispatcher。
const proxyUrl =
  process.env.HTTPS_PROXY ??
  process.env.https_proxy ??
  process.env.HTTP_PROXY ??
  process.env.http_proxy;

export const proxyEnabled = Boolean(proxyUrl);

if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}
