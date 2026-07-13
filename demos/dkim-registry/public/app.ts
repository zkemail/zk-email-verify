// Browser client for the DKIM Registry demo. Talks only to the backend API
// (/api/check, /api/update, /api/wallet), no keys or chain access here.

const BLOCKSCOUT = "https://blockscout-testnet.polkadot.io";
// Faucet pre-filled for Paseo Asset Hub: /paseo picks the network, address=
// pre-fills the recipient, parachain=1000 targets Asset Hub.
const faucetUrl = (address: string) =>
  `https://faucet.polkadot.io/paseo?address=${address}&parachain=1000`;
const PRESETS = ["ethereum.org", "github.com", "cloudflare.com", "proton.me"];

interface KeyCheck {
  keyHash: string;
  registered: boolean;
  selectors: string[];
}
interface CheckResult {
  domain: string;
  domainHash: string;
  keys: KeyCheck[];
  anyValid: boolean;
}
interface Wallet {
  address: string;
  balancePAS: string;
}

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const input = $("domain") as HTMLInputElement;
const statusEl = $("status");

function show(html: string) {
  statusEl.classList.remove("hidden");
  statusEl.innerHTML = html;
}

function keyRow(k: KeyCheck): string {
  const reg = k.registered
    ? `<span class="v yes">yes</span>`
    : `<span class="v no">no</span>`;
  return `<div class="key">
    <div class="kv"><span class="k">selector</span><span class="v">${k.selectors.join(", ")}</span></div>
    <div class="kv"><span class="k" title="Poseidon hash of the domain's DKIM public key, what the registry stores and the ZK Email circuit checks">Poseidon key hash</span><span class="v mono">${k.keyHash}</span></div>
    <div class="kv"><span class="k">registered on-chain</span>${reg}</div>
  </div>`;
}

async function walletPanel(): Promise<string> {
  try {
    const w: Wallet = await (await fetch("/api/wallet")).json();
    const bal = Number(w.balancePAS).toFixed(2);
    const explorer = `${BLOCKSCOUT}/address/${w.address}`;
    return `
      <div class="panel">
        <div class="wallet">
          <span class="muted">Prefunded demo wallet</span>
          <a href="${explorer}" target="_blank" title="View this wallet on Blockscout">${w.address}</a>
        </div>
        <div class="wallet" style="margin-top:8px">
          <span class="muted">Balance</span>
          <span>
            <a href="${explorer}" target="_blank" title="View this wallet on Blockscout">${bal} PAS</a>
            ·
            <a href="${faucetUrl(w.address)}" target="_blank" title="Opens the Paseo faucet with this address pre-filled, 5000 PAS per request, once every 24h">top up via faucet</a>
          </span>
        </div>
      </div>`;
  } catch {
    return "";
  }
}

async function check(domain: string) {
  show(`<div class="spinner">Fetching DKIM key from DNS and querying the registry…</div>`);
  let res: CheckResult;
  try {
    const r = await fetch(`/api/check?domain=${encodeURIComponent(domain)}`);
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    res = await r.json();
  } catch (e) {
    show(`<span class="bad">Error: ${String(e)}</span>`);
    return;
  }

  if (!res.keys.length) {
    show(`<span class="muted">No DKIM key found in DNS for <b>${domain}</b>. Try e.g. ethereum.org.</span>`);
    return;
  }

  const rows = res.keys.map(keyRow).join("");
  const verdict = res.anyValid
    ? `<div class="verdict ok">✅ A live DKIM key for ${domain} is registered, emails signed with it can be verified on-chain.</div>`
    : `<div class="verdict bad">❌ ${domain}'s live DKIM key is not on this registry yet.</div>`;

  const update = res.anyValid
    ? ""
    : `<div style="margin-top:14px"><button id="updateBtn">Register this domain's key</button></div>
       ${await walletPanel()}
       <p class="note">This is a testnet demo on Paseo Asset Hub and may be reset. The prefunded wallet pays gas so you don't have to connect anything.</p>`;

  show(rows + verdict + update);

  const btn = document.getElementById("updateBtn") as HTMLButtonElement | null;
  if (btn) btn.onclick = () => update_(domain, btn);
}

async function update_(domain: string, btn: HTMLButtonElement) {
  btn.disabled = true;
  btn.textContent = "Registering on-chain…";
  try {
    const r = await fetch("/api/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.error || r.statusText);
    const tx = body.txHash as string;
    show(
      `<div class="verdict ok">✅ Registered! <a href="${BLOCKSCOUT}/tx/${tx}" target="_blank">View transaction</a></div>
       <div class="spinner" style="margin-top:8px">Re-checking the registry…</div>`,
    );
    setTimeout(() => check(domain), 1500);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = "Register this domain's key";
    show(statusEl.innerHTML + `<div class="verdict bad">Error: ${String(e)}</div>`);
  }
}

async function loadRegistry() {
  try {
    const c: { registry: string } = await (await fetch("/api/config")).json();
    $("registry").innerHTML =
      `On-chain registry: <a href="${BLOCKSCOUT}/address/${c.registry}" target="_blank">${c.registry}</a>`;
  } catch {
    /* leave blank if unavailable */
  }
}
loadRegistry();

function run() {
  const domain = input.value.trim().toLowerCase();
  if (domain) check(domain);
}

($("checkBtn") as HTMLButtonElement).onclick = run;
input.addEventListener("keydown", (e) => {
  if ((e as KeyboardEvent).key === "Enter") run();
});

const chips = $("chips");
for (const p of PRESETS) {
  const el = document.createElement("span");
  el.className = "chip";
  el.textContent = p;
  el.onclick = () => {
    input.value = p;
    run();
  };
  chips.appendChild(el);
}
