# Nutrolo Prototype — Source Bundle

This ZIP contains the accepted Nutrolo Expo/React Native prototype source and its bundled image resources, configuration, tests and pnpm lockfile. It does not include `node_modules`, Git history, private environment files, API credentials or a compiled APK.

## Main source areas

- `app/` — Today, AI Plan and Food Log screens and navigation.
- `components/` — shared UI, brand and nutrition analysis components.
- `lib/` — diet types, local storage and API client.
- `server/` — server-side AI plan generation and photo nutrition analysis.
- `assets/images/` — app launcher, splash, adaptive icon and favicon files.
- `app.config.ts`, `package.json`, `pnpm-lock.yaml` — Expo/native identity and dependency configuration.

## Run the prototype

Use a current Node.js release compatible with the bundled Expo SDK and pnpm. From the extracted `nutrolo/` directory, install dependencies with `pnpm install --frozen-lockfile`. The managed development environment uses fixed Expo Web/Metro port 8081 and API port 3000. AI features require the appropriate private Manus service configuration on the server; secrets are intentionally not in this bundle and must never be placed in client-side app code.

## Android APK

This project is a managed Webdev Mobile app. Build an Android APK from the Nutrolo project's Dashboard using its native Android build action. An APK is not included until that Dashboard build finishes successfully. Do not use an Expo Web export as an APK substitute.
