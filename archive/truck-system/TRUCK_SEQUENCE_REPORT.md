# Truck sequence asset report

## Scope

This report covers only the truck asset preparation pipeline. The current
website, Hero, navigation, sections, routing, GSAP timelines, and visual
integration were not changed.

## Source inventory

- Source folder: `C:\Users\danie\Downloads\officina_frames_png`
- Source video:
  `C:\Users\danie\Downloads\kling_20260723_VIDEO_Create_an__4657_0 (1).mp4`
- Frames found: 121
- Source range: `frame_0000.png` through `frame_0120.png`
- Numbering gaps: none
- Source canvas: 1280 × 720 pixels on every frame
- Source format: RGB PNG
- Source alpha frames: 0
- Source size: 67,243,727 bytes (64.13 MiB)
- Video duration: 5.041667 seconds
- Effective source cadence: approximately 24 fps

## Visual inspection

- The dark background is baked into every source frame; it is not transparent.
- The `KlingAI 3.0` watermark is baked into the lower-right area of the
  supplied source.
- The source is an AI-generated component-opening sequence. Small generative
  detail changes remain possible even though the global motion is continuous.
- The current source is 720p and can soften when displayed full-screen on
  high-density desktop displays.

No watermark removal, background extraction, generative reconstruction, crop,
or synthetic frame interpolation was applied.

## Prepared output

- Output folder: `public/assets/truck-sequence`
- Output range: `0001.webp` through `0121.webp`
- Frames used: 121
- Output canvas: 1280 × 720 pixels on every frame
- Encoding: WebP, quality 0.92
- Output size: 10,557,852 bytes (10.07 MiB)
- Size reduction: 84.30%
- Alpha support: supported by the pipeline, but unavailable in this source

The conversion preserves the original canvas and draws every frame at the same
origin without crop or resize. A downsampled chronological continuity check
reported a median normalized adjacent-frame delta of 0.01221, a maximum of
0.02184, and a maximum detected subject-center step of 0.77 analysis pixels
(approximately 6.13 source pixels). No discontinuity or numbering jump was
introduced by the pipeline.

## Architecture prepared

- `scripts/prepare-truck-sequence.mjs` validates input numbering, PNG canvas,
  alpha availability, video metadata, conversion output, and adjacent-frame
  continuity before producing the WebP sequence.
- `src/config/truck-sequence.config.ts` centralizes path, format, dimensions,
  frame range, cadence, preload concurrency, and future metadata.
- `src/lib/truck-sequence/TruckSequenceLoader.ts` provides the isolated
  `load()`, `getFrame(index)`, `isLoaded()`, and `release()` API.
- The loader uses bounded parallel fetches, atomic failure handling,
  abort support, object URLs, and explicit resource release.
- No application component imports the loader yet.

## Production blockers and next gate

The files are technically normalized and optimized, but the supplied source is
not a clean final-production master because it contains a baked watermark and
no alpha channel. Commercial usage rights for the generated source should also
be verified.

Before visual integration, replace the source with a licensed, watermark-free
master using the same 24 fps chronology. Prefer 1920 × 1080 minimum (2560 ×
1440 for large desktop presentation), WebP with alpha when transparency is
needed, and keep the `0001.webp` through `0121.webp` contract so the loader and
future consumers remain unchanged.
