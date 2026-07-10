import path from "path";
import express from "express";
import { JsonRpcProvider, Wallet, formatEther } from "ethers";
import { checkDomain, updateDomain, DEFAULT_RPC } from "../../scripts/dkim/core";

require("dotenv").config();

// Web demo backend. Three endpoints over the shared DKIM-registry core:
//   GET  /api/check?domain=   read-only lookup (public RPC, no key)
//   POST /api/update {domain} owner-only registration (prefunded wallet)
//   GET  /api/wallet          address + balance of the prefunded wallet
//
// The write path is rate-limited per IP and serialized through a queue so
// concurrent requests can't collide on the wallet nonce. The nonce itself is
// read fresh from chain by ethers on each send, so a restart can't desync it.

const PORT = Number(process.env.PORT) || 3000;
const RPC_URL = process.env.RPC_URL || DEFAULT_RPC;
const REGISTRY = process.env.DKIM_REGISTRY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!REGISTRY) throw new Error("DKIM_REGISTRY not set");
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY not set");

const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);

const app = express();
app.set("trust proxy", true); // behind Render's proxy, so req.ip is the real client
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- per-IP rate limit for the write endpoint ---
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

// --- serialize update txs so they never race on the nonce ---
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

app.get("/api/config", (_req, res) => {
  res.json({ registry: REGISTRY });
});

app.get("/api/wallet", async (_req, res) => {
  try {
    const balance = await provider.getBalance(wallet.address);
    res.json({ address: wallet.address, balancePAS: formatEther(balance) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/check", async (req, res) => {
  const domain = String(req.query.domain || "").trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: "domain required" });
  try {
    res.json(await checkDomain(domain, REGISTRY, provider));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/update", async (req, res) => {
  const ip = req.ip || "unknown";
  const domain = String(req.body?.domain || "").trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: "domain required" });
  if (rateLimited(ip))
    return res.status(429).json({ error: "Rate limited — try again shortly." });
  try {
    const result = await enqueue(() => updateDomain(domain, REGISTRY, wallet));
    if (!result.txHash)
      return res
        .status(404)
        .json({ error: "No DKIM key found in DNS for this domain." });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () =>
  console.log(`DKIM demo listening on :${PORT} (registry ${REGISTRY})`),
);
