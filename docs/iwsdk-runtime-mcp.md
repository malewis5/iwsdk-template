# Driving the IWSDK Runtime MCP in the v0 Sandbox

How to bring the **`iwsdk-runtime`** MCP server online inside a v0 sandbox and
call its tools against the live running app — including screenshots, Three.js
scene inspection, ECS introspection, and simulated XR input.

This is normally an "impossible in the sandbox" task because the runtime MCP
depends on a managed Playwright browser. It works; the steps below are the
result of debugging the failure chain end to end.

---

## What this gets you

Driving `iwsdk mcp stdio` through a real MCP client exposes **45 runtime tools**:

| Group     | Count | Examples |
| --------- | ----- | -------- |
| `xr`      | 16    | session status, controller/hand/headset transforms, input simulation |
| `scene`   | 13    | live Three.js hierarchy, object transforms, scene composition |
| `ecs`     | 11    | list systems, find/query entities, pause / step / diff |
| `browser` | 3     | screenshot, console logs, reload |
| `ui`      | 2     | uikit inspection |

All of them return **live data from the running app**, not static metadata.

**The headset is emulated, no real device or Chrome extension needed.** IWSDK
ships a WebXR emulator baked into every project (see the `dev.emulator` block in
`iwsdk.config.json`), so `xr_accept_session` really does enter an immersive-VR
session on an emulated Meta Quest 3 and `xr_set_transform` drives the headset /
controllers / hands. See "Entering the emulated headset" below for the config
that gates it.

**Still not possible here:** the `metavr` server's *physical* Quest device
management — there is no real headset attached to the sandbox. The emulated XR
session is unaffected by this.

---

## The architecture (why it's fiddly)

The runtime MCP is a **bridge**, not a standalone server. Three processes have
to line up:

```
iwsdk dev  (Vite + runtime bridge on :8081)   <-- v0's supervised preview
      |  spawns via the  dev:runtime  script
      v
managed Playwright browser (headless Chromium) --- connects back over the WS bridge
      ^
      |  WebSocket handshake  (connectedClientCount, browserCommandReady)
      |
iwsdk mcp stdio  <-- an MCP client drives this over JSON-RPC/stdio
```

Key facts that are easy to get wrong:

- The runtime tools act on the dev server's **own managed browser** (driven over
  CDP), **not** on whatever browser happens to have the URL open. Opening the app
  in `agent-browser` renders it fine but stays invisible to the bridge
  (`connectedClientCount: 0`).
- Tool *metadata* (`tools/list`, `mcp inspect`) works with no browser. Tool
  *calls* return `isError: true` with cause `browser_not_launched` until the
  managed browser is connected.

---

## The three fixes (in order of discovery)

### 1. Use the correct CLI entry point

`node_modules/@iwsdk/cli/dist/index.js` only **exports** `runCli` — it has no
bootstrap, so running it directly produces **no output** and exits 0. This is the
single biggest time-sink; it looks like the server is silently broken.

The real bin is **`dist/cli.js`** (see `package.json` `bin`), exposed as
`node_modules/.bin/iwsdk` / `pnpm exec iwsdk`.

```bash
# WRONG — silent, does nothing
node node_modules/@iwsdk/cli/dist/index.js mcp inspect

# RIGHT
pnpm exec iwsdk mcp inspect
# ...or spawn dist/cli.js from an MCP client (see below)
```

### 2. Install Chromium's system libraries with `dnf` (not apt)

`npx playwright install chromium` downloads the **browser binary** but not its
OS-level shared libraries. In this sandbox Chromium then crashes on launch with
empty logs.

Diagnose with `ldd`:

```bash
SHELL_BIN=$(find ~/.cache/ms-playwright -name chrome-headless-shell | head -1)
ldd "$SHELL_BIN" | grep 'not found'
# libnspr4.so, libnss3.so, libX11.so, libgbm.so, libasound.so, ... (~18 libs)
```

Playwright's own `install-deps` only knows `apt-get`, but this sandbox is
**Amazon Linux / Fedora-family with `dnf` + `sudo`**. Install directly:

```bash
sudo -n dnf install -y \
  nspr nss nss-util atk at-spi2-atk at-spi2-core dbus-libs \
  libX11 libXcomposite libXdamage libXext libXfixes libXrandr \
  mesa-libgbm libxcb libxkbcommon alsa-lib cups-libs pango cairo
```

Verify a real launch afterwards (should print the app title + `canvas: true`).
Resolve the pinned `playwright-core` path under `.pnpm` for your lockfile —

```bash
node -e '
const { createRequire } = require("module");
const path = require("path");
const fs = require("fs");
const root = process.cwd() + "/node_modules/.pnpm";
const dir = fs.readdirSync(root).find((n) => n.startsWith("playwright-core@"));
if (!dir) throw new Error("playwright-core not found under .pnpm");
const req = createRequire(path.join(root, dir, "node_modules/playwright-core/"));
const pw = req("playwright-core");
(async () => {
  const b = await pw.chromium.launch({ headless: true, args:["--no-sandbox","--disable-gpu"] });
  const p = await b.newPage();
  await p.goto("http://localhost:8081/", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise(r=>setTimeout(r,4000));
  console.log(await p.evaluate(()=>({title:document.title, canvas:!!document.querySelector("canvas")})));
  await b.close();
})();'
```

### 3. Do not hardcode `IWSDK_DEV_OPEN=false` on `dev:runtime`

`iwsdk dev restart` re-launches the runtime by running the **`dev:runtime`**
npm script — **not** `dev`. If `dev:runtime` hardcodes `IWSDK_DEV_OPEN=false`
(a common v0 preview patch), that shell assignment **overrides** the CLI's
`--open` flag. Editing `dev` alone has no effect on the managed browser.

This template keeps the scripts split:

```jsonc
// package.json
"dev": "IWSDK_DEV_OPEN=false IWSDK_DEV_HTTPS=false vite",   // v0 preview iframe
"dev:runtime": "IWSDK_DEV_HTTPS=false vite"                 // CLI controls open/headless/ai
```

`dev` stays preview-only so Open-in-v0 does not depend on Playwright. For agent
work, pass flags on the CLI (they set `IWSDK_DEV_*` on the child env):

```bash
pnpm exec iwsdk dev restart --open --headless --ai-mode agent
```

`--headless` is essential in the sandbox — only headless Chromium runs there.
`--ai-mode agent` puts the runtime in agent mode.

---

## Bringing it online

```bash
# 1. (once) browser binary + system libs — step 2 above
# 2. restart the runtime so it launches the managed browser
pnpm exec iwsdk dev restart --open --headless --ai-mode agent

# 3. poll until the managed browser is connected
pnpm exec iwsdk dev status
```

Success looks like this in `dev status`:

```json
{
  "browserConnected": true,
  "browserCommandReady": true,
  "session": { "browser": { "status": "connected", "connectedClientCount": 2 } },
  "browserIssue": null
}
```

The preview can keep serving on the Vite port throughout — enabling the managed
browser does not replace the supervised preview URL.

---

## Talking to the MCP from a client

The server speaks JSON-RPC over stdio using the official
`@modelcontextprotocol/sdk` (present transitively under `.pnpm`). Spawn
**`dist/cli.js mcp stdio`** — not `index.js`. Prefer the CLI/MCP surface your
harness already wires (Cursor/Claude `.mcp.json`); in a bare sandbox, a small
stdio client works:

```js
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const pnpm = path.join(process.cwd(), "node_modules/.pnpm");
const sdkDir = fs.readdirSync(pnpm).find((n) => n.startsWith("@modelcontextprotocol+sdk@"));
if (!sdkDir) throw new Error("MCP SDK not found under .pnpm");
const SDK = path.join(pnpm, sdkDir, "node_modules/@modelcontextprotocol/sdk/dist/esm");
const { Client } = await import(`${SDK}/client/index.js`);
const { StdioClientTransport } = await import(`${SDK}/client/stdio.js`);

const transport = new StdioClientTransport({
  command: "node",
  args: [process.cwd() + "/node_modules/@iwsdk/cli/dist/cli.js", "mcp", "stdio"],
  cwd: process.cwd(),
  stderr: "pipe",
});

const client = new Client({ name: "v0", version: "1.0" }, { capabilities: {} });
await client.connect(transport);

const { tools } = await client.listTools();
console.log("tools:", tools.length);

await client.callTool({ name: "xr_get_session_status", arguments: {} });
await client.callTool({ name: "scene_get_runtime_hierarchy", arguments: {} });
await client.callTool({ name: "ecs_list_systems", arguments: {} });
const shot = await client.callTool({ name: "browser_screenshot", arguments: {} });
// image content parts arrive base64 in shot.content[].data

await client.close();
```

The CLI is equivalent for scripting: `pnpm exec iwsdk xr status`,
`pnpm exec iwsdk browser screenshot --output-file …`, etc.

---

## Entering the emulated headset

The emulator is already enabled in `iwsdk.config.json`:

```jsonc
"dev": {
  "emulator": { "device": "metaQuest3", "activation": "always", "injectOnBuild": true }
}
```

But `xr_accept_session` fails with **"No session has been offered"** whenever the
app has XR turned **off**. A browser-first scaffold often ships with:

```jsonc
"world": { "xr": false, ... }   // flat/browser mode — never offers an XR session
```

With `xr: false` the app never calls `offerSession()`, so the emulator has
nothing to enter. Enable XR (and prefer an explicit offer) so the session is
offerable:

```jsonc
"world": { "xr": { "mode": "vr", "offer": "always" }, ... }
```

Then restart / reload and enter the headset:

```js
await client.callTool({ name: "xr_accept_session", arguments: {} });
// -> { success: true }
// xr_get_session_status: sessionActive:true, sessionMode:"immersive-vr", …

await client.callTool({ name: "xr_set_transform", arguments: {
  device: "headset",
  position: { x: 0, y: 1.6, z: 0 },
  orientation: { pitch: -18, yaw: 35, roll: 0 },
}});
```

Screenshots taken after entering the session render the **stereo XR viewport**
(barrel-distorted) with the emulated controllers visible when the session is
live.

> Note: enabling `world.xr` changes runtime behavior (Enter XR becomes available).
> Use `"xr": false` if you want a flat-only preview default.

---

## Gotchas / debugging notes

- **Silent no-output** from the CLI => you're running `dist/index.js`. Use
  `dist/cli.js` / `pnpm exec iwsdk`.
- **Piping JSON-RPC by hand** (echo/FIFO into `mcp stdio`) is flaky — the child
  exits on stdin EOF / SIGPIPE before flushing. Use a real MCP SDK client or the
  `iwsdk` CLI domain commands.
- **`browser_not_launched`** on every tool call => the managed browser isn't
  connected. Check `dev status`; confirm `dev:runtime` does **not** force
  `IWSDK_DEV_OPEN=false`, then run `iwsdk dev restart --open --headless --ai-mode agent`.
- **Chromium launch crash, empty logs** => missing system libs; `ldd | grep 'not
  found'` then `dnf install`.
- **Editing `dev` did nothing** => the runtime uses `dev:runtime`.
- **`agent-browser` shows the app but bridge says 0 clients** — expected; the
  tools need the dev server's *managed* browser, not an external one.
- Runtime logs live at `.iwsdk/runtime/logs/dev-*.log`; session state at
  `.iwsdk/runtime/session.json`.
