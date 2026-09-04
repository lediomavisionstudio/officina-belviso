# Officina Belviso Design System

`src/styles/tokens.css` è la sorgente CSS dei token visivi. I componenti React
possono consultare lo stesso contratto tramite `src/config/designSystem.ts`.

## Regole

- I nuovi colori devono essere aggiunti come ruoli semantici, non come valori
  isolati nei componenti.
- Tipografia, spacing, radius, ombre e transizioni devono usare i token
  esistenti oppure estendere la relativa scala.
- I nuovi pulsanti devono usare `Button` o `ButtonLink`.
- Le nuove card devono partire da `Card`, con `CardHeader`, `CardBody` e
  `CardFooter` quando necessari.
- I layout devono usare `Container`.
- Input, textarea, select, checkbox, radio e upload devono riusare i controlli
  presenti in `components/contact/FormControls.tsx`.

## Breakpoint

I breakpoint ufficiali sono dichiarati in `src/config/designSystem.ts`:

- compact: 380 px
- mobile: 620 px
- tablet: 960 px
- desktop: 1120 px

CSS non permette variabili custom affidabili nelle media query senza introdurre
un preprocessore. Per questo i valori sono dichiarati nel contratto TypeScript e
le media query esistenti ne mantengono la rappresentazione CSS equivalente.
