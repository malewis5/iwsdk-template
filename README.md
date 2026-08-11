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

This is a static Vite SPA. Vercel’s Vite preset uses `vite build` with output in
`dist`. SPA deep-link rewrites are configured in `vercel.json`.
