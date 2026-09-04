export const truckSequenceConfig = Object.freeze({
  directory: '/assets/truck-sequence',
  extension: 'auto',
  extensionPriority: Object.freeze(['webp', 'png'] as const),
  firstFrame: 1,
  lastFrame: 121,
  frameCount: 121,
  maximumFrameCount: 240,
  filenamePadding: 4,
  recommendedFps: 24,
  preload: Object.freeze({
    enabled: true,
    concurrency: 6,
  }),
  renderer: Object.freeze({
    bitmapCacheSize: 12,
    devicePixelRatioCap: 2,
  }),
  scroll: Object.freeze({
    start: 'top top',
    end: '+=500%',
    scrub: 0.35,
    pin: true,
    anticipatePin: 1,
  }),
  fallback: Object.freeze({
    staticImagePath: '/assets/camion-officina-belviso.png',
  }),
  future: Object.freeze({
    expectedWidth: null,
    expectedHeight: null,
    transparentBackground: true,
    manifestPath: null,
    variants: Object.freeze({}),
  }),
})

export type TruckSequenceExtension =
  (typeof truckSequenceConfig.extensionPriority)[number]

export type TruckSequenceConfig = typeof truckSequenceConfig

export function getTruckSequenceFramePath(
  frameNumber: number,
  extension: TruckSequenceExtension,
): string {
  const {
    directory,
    filenamePadding,
    firstFrame,
    maximumFrameCount,
  } = truckSequenceConfig
  const maximumFrameNumber = firstFrame + maximumFrameCount - 1

  if (
    !Number.isInteger(frameNumber) ||
    frameNumber < firstFrame ||
    frameNumber > maximumFrameNumber
  ) {
    throw new RangeError(
      `Truck sequence frame must be an integer between ${firstFrame} and ${maximumFrameNumber}`,
    )
  }

  return `${directory}/${String(frameNumber).padStart(filenamePadding, '0')}.${extension}`
}
