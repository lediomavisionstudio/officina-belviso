import { chromium } from '@playwright/test'
import process from 'node:process'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5173/'
const expectedFrames = 121
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage()
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })

  const result = await page.evaluate(async () => {
    const { TruckSequenceLoader } = await import(
      '/src/lib/truck-sequence/TruckSequenceLoader.ts'
    )
    const loader = new TruckSequenceLoader()
    const loadedBefore = loader.isLoaded()

    const loadResult = await loader.load()

    const first = loader.getFrame(0)
    const last = loader.getFrame(120)
    const progressStart = loader.getProgressFrame(0)
    const progressMiddle = loader.getProgressFrame(0.5)
    const progressEnd = loader.getProgressFrame(1)
    const loadedAfter = loader.isLoaded()
    const firstResponse = await fetch(first.source)
    const lastResponse = await fetch(last.source)
    const firstBytes = (await firstResponse.blob()).size
    const lastBytes = (await lastResponse.blob()).size
    let decodedFrames = 0

    for (let index = 0; index < 121; index += 1) {
      const frame = loader.getFrame(index)
      const bitmap = await createImageBitmap(frame.blob)

      if (bitmap.width !== 1280 || bitmap.height !== 720) {
        bitmap.close()
        throw new Error(
          `Unexpected dimensions for frame ${frame.frameNumber}: ${bitmap.width}x${bitmap.height}`,
        )
      }

      bitmap.close()
      decodedFrames += 1
    }

    let rangeGuarded = false

    try {
      loader.getFrame(121)
    } catch (error) {
      rangeGuarded = error instanceof RangeError
    }

    loader.release()

    return {
      firstBytes,
      firstFrameNumber: first.frameNumber,
      decodedFrames,
      loadResult,
      lastBytes,
      lastFrameNumber: last.frameNumber,
      loadedAfter,
      loadedBefore,
      loadedAfterRelease: loader.isLoaded(),
      progressFrameNumbers: [
        progressStart.frameNumber,
        progressMiddle.frameNumber,
        progressEnd.frameNumber,
      ],
      rangeGuarded,
    }
  })

  const checks = [
    result.loadedBefore === false,
    result.loadedAfter === true,
    result.loadedAfterRelease === false,
    result.loadResult.mode === 'sequence',
    result.loadResult.extension === 'webp',
    result.loadResult.frameCount === expectedFrames,
    result.firstFrameNumber === 1,
    result.lastFrameNumber === expectedFrames,
    result.decodedFrames === expectedFrames,
    result.progressFrameNumbers.join(',') === '1,61,121',
    result.firstBytes > 0,
    result.lastBytes > 0,
    result.rangeGuarded === true,
  ]

  if (checks.some((check) => !check)) {
    throw new Error(`Truck sequence loader verification failed: ${JSON.stringify(result)}`)
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

  const fallbackPage = await browser.newPage()
  await fallbackPage.route('**/assets/truck-sequence/*', (route) =>
    route.fulfill({
      status: 404,
      contentType: 'text/plain',
      body: 'Not found',
    }),
  )
  await fallbackPage.goto(baseUrl, { waitUntil: 'domcontentloaded' })

  const fallbackResult = await fallbackPage.evaluate(async () => {
    const { TruckSequenceLoader } = await import(
      '/src/lib/truck-sequence/TruckSequenceLoader.ts'
    )
    const loader = new TruckSequenceLoader()
    const loadResult = await loader.load()
    const frame = loader.getProgressFrame(0.75)
    const result = {
      loadResult,
      isFallback: frame.isFallback,
      frameCount: loadResult.frameCount,
    }
    loader.release()
    return result
  })

  if (
    fallbackResult.loadResult.mode !== 'static' ||
    fallbackResult.loadResult.extension !== 'static' ||
    fallbackResult.frameCount !== 1 ||
    fallbackResult.isFallback !== true
  ) {
    throw new Error(
      `Truck sequence fallback verification failed: ${JSON.stringify(fallbackResult)}`,
    )
  }

  process.stdout.write(`${JSON.stringify({ fallback: fallbackResult }, null, 2)}\n`)

  const degradedPage = await browser.newPage()
  await degradedPage.route('**/assets/truck-sequence/0061.webp', (route) =>
    route.fulfill({
      status: 404,
      contentType: 'text/plain',
      body: 'Not found',
    }),
  )
  await degradedPage.goto(baseUrl, { waitUntil: 'domcontentloaded' })

  const degradedResult = await degradedPage.evaluate(async () => {
    const { TruckSequenceLoader } = await import(
      '/src/lib/truck-sequence/TruckSequenceLoader.ts'
    )
    const loader = new TruckSequenceLoader()
    const loadResult = await loader.load()
    const substitutedFrame = loader.getProgressFrame(0.5)
    const result = {
      loadResult,
      frameNumber: substitutedFrame.frameNumber,
      sourceFrameNumber: substitutedFrame.sourceFrameNumber,
      isSubstitute: substitutedFrame.isSubstitute,
    }
    loader.release()
    return result
  })

  if (
    degradedResult.loadResult.mode !== 'sequence' ||
    degradedResult.loadResult.frameCount !== expectedFrames ||
    !degradedResult.loadResult.substitutedFrameNumbers.includes(61) ||
    degradedResult.frameNumber !== 61 ||
    degradedResult.sourceFrameNumber !== 60 ||
    degradedResult.isSubstitute !== true
  ) {
    throw new Error(
      `Truck sequence degraded-mode verification failed: ${JSON.stringify(degradedResult)}`,
    )
  }

  process.stdout.write(`${JSON.stringify({ degraded: degradedResult }, null, 2)}\n`)
} finally {
  await browser.close()
}
