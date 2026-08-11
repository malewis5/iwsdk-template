# IWSDK App

This project uses `iwsdk.config.json` for declarative scene, asset, component,
XR, and emulator configuration. Application systems remain explicit in
`src/index.ts`.

```sh
pnpm install
pnpm dev
```

`pnpm dev` starts Vite with `IWSDK_DEV_OPEN=false` and `IWSDK_DEV_HTTPS=false`
so the managed Chromium browser is not launched and the server uses HTTP
(required for v0 and other remote previews). The WebXR emulator is still
enabled via `iwsdk.config.json` (`dev.emulator`).

`dev:runtime` is what `iwsdk dev up` / `restart` actually spawn. It only forces
HTTP (`IWSDK_DEV_HTTPS=false`) so CLI flags can control the managed browser:
`--open` / `--no-open`, `--headless` / `--headed`, `--ai-mode agent|collaborate`.
For the local managed browser with Runtime/Editor controls, use
`pnpm run dev:open`. For headless agent/MCP work (including in a v0 sandbox
after Playwright Chromium + OS libs are installed):

```sh
pnpm exec iwsdk dev restart --open --headless --ai-mode agent
pnpm exec iwsdk dev status   # wait for browserCommandReady: true
```

For the full v0-sandbox bring-up (Playwright system libs, MCP stdio client,
emulated headset), see [docs/iwsdk-runtime-mcp.md](docs/iwsdk-runtime-mcp.md).

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmalewis5%2Fiwsdk-template&project-name=iwsdk-template&repository-name=iwsdk-template)

This is a static Vite SPA. Vercel’s Vite preset uses `vite build` with output in
`dist`. SPA deep-link rewrites are configured in `vercel.json`.

## Open in v0

[![Open in v0](https://v0.app/chat-static/button.svg)](https://v0.app/chat/api/open?title=IWSDK+Template&prompt=Read+the+skills+included+in+this+repo+and+set+up+the+local+development+environment.&url=https%3A%2F%2Fiwsdk-template.labs.vercel.dev%2Fr%2Fiwsdk-template.json)

This repository is a [shadcn registry](https://ui.shadcn.com/docs/registry/open-in-v0).
The registry item JSON is built to `public/r/iwsdk-template.json` and served at
[https://iwsdk-template.labs.vercel.dev/r/iwsdk-template.json](https://iwsdk-template.labs.vercel.dev/r/iwsdk-template.json).
