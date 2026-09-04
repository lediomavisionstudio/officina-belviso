# Officina Belviso

Frontend Vite + React + TypeScript per Officina Belviso.

## Comandi

- `pnpm dev`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:e2e`
- `pnpm build`

## Architettura

- `src/app`: composizione e routing dell'applicazione.
- `src/components`: componenti UI, layout, SEO e sezioni della Home.
- `src/config`: dati aziendali centralizzati.
- `src/constants`: navigazione e definizione delle route.
- `src/data`: contenuti editoriali della Home.
- `src/hooks`: hook condivisi.
- `src/pages`: pagine pubbliche.
- `src/types`: contratti TypeScript.
- `src/utils`: utility pure.
- `src/styles/tokens.css`: token semantici del Design System.

Il contratto del Design System è documentato in `DESIGN_SYSTEM.md`. Colori,
tipografia, spacing, radius, ombre, motion, container e breakpoint sono
centralizzati e disponibili ai componenti React tramite
`src/config/designSystem.ts`.

Le route future sono dichiarate in `src/constants/routes.ts`. Il file
`public/_redirects` abilita il fallback della SPA sugli hosting che supportano
questa convenzione; sugli altri provider va configurata una riscrittura
equivalente verso `index.html`.

I riferimenti aziendali sono centralizzati in `src/config/site.ts`. I valori
ancora non forniti dal cliente restano `null` e non vengono inventati.

La Home utilizza navigazione a sezioni, carousel accessibili, form frontend
riutilizzabili e animazioni GSAP compatibili con `prefers-reduced-motion`.

Il logo ufficiale è disponibile in `public/assets`. Gli spazi fotografici e i
marchi sono placeholder intenzionali, predisposti per gli asset definitivi del
cliente. I form eseguono validazione lato client ma non inviano dati finché non
verrà collegato un servizio backend.
