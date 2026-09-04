# Archivio tecnico

Questa cartella conserva funzionalità non collegate alla Home V2. I file non
partecipano alla compilazione Vite/TypeScript e non vengono pubblicati come
asset del sito corrente.

## `truck-system`

Contiene il precedente Truck Animation System completo:

- componenti Hero, Canvas, Explorer, Hotspot, Callout e illuminazione;
- configurazioni, hook, tipi, loader e renderer;
- script di preparazione e verifica;
- sequenza originale di 121 frame, relativo backup e immagine statica;
- report e documentazione della pipeline.

La gerarchia originale `src`, `public` e `scripts` è stata mantenuta per rendere
il ripristino esplicito e reversibile. Il sistema dipende inoltre dai componenti
attivi `src/components/ui/Container.tsx` e
`src/components/layout/StoryNav.tsx`.

Per riattivarlo, riportare i file nelle rispettive posizioni originali e
rieseguire typecheck, lint, build e test end-to-end. Non importare direttamente
codice dalla cartella `archive`.

## `legacy-frontend`

Contiene il componente generico `ContentSection` non più raggiungibile da alcun
entry point. È conservato come riferimento e non viene incluso nel bundle.
