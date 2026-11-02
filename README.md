# nutrolo-app

## Deploy the web app to Cloudflare Pages

This repository contains an Expo web client and a separate Express/MySQL API. Cloudflare
Pages hosts the static web client; it does not deploy the Express server.

1. In Cloudflare, create a **Pages** project named `nutrolo-app` and connect this GitHub
   repository.
2. Set the build command to `pnpm run build:web` and the build output directory to `web-build`.
   If Cloudflare asks for a deploy command, use `pnpm run deploy:pages` (or
   `npx wrangler pages deploy web-build --project-name=nutrolo-app`). Do not use
   `pnpm run build` or `npx wrangler deploy`: the former builds the separate API server and the
   latter deploys a Worker, not a Pages site. `wrangler.toml` also declares the Pages output
   directory.
3. Add `EXPO_PUBLIC_API_BASE_URL` as a Pages build environment variable with the public HTTPS
   origin of your separately hosted API, for example `https://api.example.com`. Do not include
   `/api` at the end. Expo embeds this value into the web build, so rebuild after changing it.
4. Configure the API's `EXPO_WEB_PREVIEW_URL` environment variable with the exact public
   Cloudflare Pages origin, such as `https://nutrolo.pages.dev`, and restart the API. This lets
   the API accept browser requests from the deployed site. If using a custom domain, use that
   origin instead.

The API must also be deployed separately with its required database and server environment
variables. A Pages deployment without a reachable API can serve the web app, but API-backed
features and login will not work.

For a local production web build, run `pnpm run build:web`; the generated site is in `web-build`.
