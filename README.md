# IWSDK App

This project uses `iwsdk.config.json` for declarative scene, asset, component,
XR, and emulator configuration. Application systems remain explicit in
`src/index.ts`.

```sh
npm install
npm run dev
```

Use the Runtime and Editor controls in the managed browser to switch between
the running experience and its authored scene.

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmalewis5%2Fiwsdk-template&project-name=iwsdk-template&repository-name=iwsdk-template)

This is a static Vite SPA. Vercel’s Vite preset uses `vite build` with output in
`dist`. SPA deep-link rewrites are configured in `vercel.json`.

## Open in v0

[![Open in v0](https://cdn.jsdelivr.net/gh/malewis5/iwsdk-template@main/public/open-in-v0.svg)](https://v0.dev/chat/api/open?title=IWSDK+Template&url=https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Fmalewis5%2Fiwsdk-template%40main%2Fpublic%2Fr%2Fiwsdk-template.json)

This repository is a [shadcn registry](https://ui.shadcn.com/docs/registry/open-in-v0).
The registry item JSON is built to `public/r/iwsdk-template.json` and served at
`/r/iwsdk-template.json` after deploy.
