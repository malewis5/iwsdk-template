# IWSDK App

This project uses `iwsdk.config.json` for declarative scene, asset, component,
XR, and emulator configuration. Application systems remain explicit in
`src/index.ts`.

```sh
pnpm install
pnpm dev
```

Use the Runtime and Editor controls in the managed browser to switch between
the running experience and its authored scene.

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmalewis5%2Fiwsdk-template&project-name=iwsdk-template&repository-name=iwsdk-template)

This is a static Vite SPA. Vercel’s Vite preset uses `vite build` with output in
`dist`. SPA deep-link rewrites are configured in `vercel.json`.

## Open in v0

[![Open in v0](https://v0.app/chat-static/button.svg)](https://v0.app/chat/api/open?title=IWSDK+Template&prompt=Read+the+skills+included+in+this+repo+and+set+up+the+local+development+environment.&url=https%3A%2F%2Fiwsdk-template.labs.vercel.dev%2Fr%2Fiwsdk-template.json)

This repository is a [shadcn registry](https://ui.shadcn.com/docs/registry/open-in-v0).
The registry item JSON is built to `public/r/iwsdk-template.json` and served at
[https://iwsdk-template.labs.vercel.dev/r/iwsdk-template.json](https://iwsdk-template.labs.vercel.dev/r/iwsdk-template.json).
