# Truck sequence

Questa cartella è l'unico punto di ingresso per la futura sequenza definitiva
del camion. Il loader non è ancora collegato alla Hero o allo Scroll Engine.

## Formati supportati

- Preferito: WebP con canale alpha.
- Alternativa: PNG RGBA.
- Non mescolare WebP e PNG nella stessa sequenza.
- WebP ha sempre priorità quando entrambi i formati sono presenti.
- Non usare JPEG, AVIF, GIF, SVG o file video in questa cartella.

## Naming obbligatorio

I file devono partire da `0001` e avere quattro cifre:

```text
0001.webp
0002.webp
0003.webp
...
```

In alternativa:

```text
0001.png
0002.png
0003.png
...
```

La numerazione deve essere continua, senza salti o numeri duplicati. L'ordine
cronologico deve corrispondere all'ordine numerico dei nomi.

## Specifiche consigliate

- Canvas minimo: 1920 × 1080 px.
- Canvas consigliato per desktop premium: 2560 × 1440 px.
- Tutti i frame devono avere esattamente le stesse dimensioni.
- Sfondo trasparente reale, non nero o bianco incorporato.
- Profilo colore sRGB.
- Frame rate consigliato: 24 fps.
- Contratto V1.1: esattamente 121 frame.
- Capacità massima riservata per versioni future: 240 frame.
- Compressione WebP consigliata: qualità 90–94, preservando l'alpha.

Il camion deve mantenere lo stesso punto di ancoraggio e non deve cambiare
scala o posizione in modo involontario tra due frame consecutivi.

## Come sostituire la sequenza

1. Conservare questo `README.md`.
2. Rimuovere solamente i vecchi file numerati dalla cartella.
3. Copiare la nuova sequenza completa usando WebP oppure PNG.
4. Verificare che la sequenza vada da `0001` a `0121` senza salti.
5. Eseguire:

   ```text
   node scripts/validate-truck-sequence.mjs public/assets/truck-sequence
   ```

Non è necessario modificare configurazione, loader, Hero o altri componenti:
il loader rileva automaticamente il formato e utilizza il contratto fisso di
121 frame.
