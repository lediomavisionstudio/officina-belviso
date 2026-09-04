import { chromium, firefox, webkit } from '@playwright/test'
import process from 'node:process'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5173/'
const browserName = process.argv[3] ?? 'chromium'
const browserType = {
  chromium,
  firefox,
  webkit,
}[browserName]

if (!browserType) {
  throw new Error(`Unsupported browser: ${browserName}`)
}

const browser = await browserType.launch({ headless: true })

async function preparePage(page, reducedMotion = 'no-preference') {
  const isolatedUrl = new URL(baseUrl)
  isolatedUrl.searchParams.set('truck-engine-verify', 'isolated')

  await page.emulateMedia({ reducedMotion })
  await page.addInitScript(() => {
    window.sessionStorage.setItem('officina-belviso-intro-seen', 'true')
  })
  await page.goto(isolatedUrl.href, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div style="height: 120px"></div>
      <section id="truck-engine-trigger" style="height: 2400px">
        <canvas
          id="truck-engine-canvas"
          style="display:block;width:min(100%,640px);height:min(56.25vw,360px)"
        ></canvas>
      </section>
    `
  })
}

try {
  const page = await browser.newPage()
  const requestedSequenceFiles = []
  const runtimeErrors = []

  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname

    if (pathname.includes('/assets/truck-sequence/')) {
      requestedSequenceFiles.push(pathname)
    }
  })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(message.text())
    }
  })

  await preparePage(page)

  const initialized = await page.evaluate(async () => {
    window.__truckLongTasks = []

    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        window.__truckLongTasks.push(
          ...list.getEntries().map((entry) => entry.duration),
        )
      })
      longTaskObserver.observe({ type: 'longtask', buffered: true })
      window.__truckLongTaskObserver = longTaskObserver
    }

    const originalCreateImageBitmap = window.createImageBitmap.bind(window)
    const originalBitmapClose = ImageBitmap.prototype.close
    window.__truckBitmapCreations = 0
    window.__truckBitmapCloses = 0
    window.__truckBitmapCreationSizes = []
    ImageBitmap.prototype.close = function closeTrackedBitmap() {
      window.__truckBitmapCloses += 1
      return originalBitmapClose.call(this)
    }
    window.createImageBitmap = (...arguments_) => {
      window.__truckBitmapCreations += 1
      window.__truckBitmapCreationSizes.push(arguments_[0]?.size ?? null)
      return originalCreateImageBitmap(...arguments_)
    }

    const { TruckAnimationEngine } = await import(
      '/src/lib/truck-sequence/TruckAnimationEngine.ts'
    )
    const canvas = document.querySelector('#truck-engine-canvas')
    const trigger = document.querySelector('#truck-engine-trigger')
    const context = canvas.getContext('2d')
    const originalDrawImage = context.drawImage.bind(context)
    window.__truckCanvasDraws = 0
    context.drawImage = (...arguments_) => {
      window.__truckCanvasDraws += 1
      return originalDrawImage(...arguments_)
    }
    const engine = new TruckAnimationEngine({
      canvas,
      trigger,
      scrub: 0.1,
    })
    const result = await engine.init()

    window.__truckEngineTest = {
      engine,
    }

    const scrollTrigger = engine.scrollTween.scrollTrigger

    return {
      result,
      currentFrameIndex: engine.getCurrentFrameIndex(),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      scrollDriven: engine.isScrollDriven(),
      pinned: engine.isPinned(),
      scrollStart: scrollTrigger.start,
      scrollEnd: scrollTrigger.end,
      bitmapCreations: window.__truckBitmapCreations,
      canvasDraws: window.__truckCanvasDraws,
    }
  })

  await page.waitForTimeout(200)
  await page.evaluate(() => {
    window.__truckLongTasks = []
    window.__truckEngineTest.engine.requestProgress(0)
  })
  await page.waitForTimeout(100)
  const afterSameFrameRequest = await page.evaluate(() => ({
    currentFrameIndex: window.__truckEngineTest.engine.getCurrentFrameIndex(),
    bitmapCreations: window.__truckBitmapCreations,
    canvasDraws: window.__truckCanvasDraws,
  }))

  await page.evaluate(({ start, end }) => {
    window.scrollTo({
      top: start + (end - start) * 0.5,
      behavior: 'instant',
    })
  }, { start: initialized.scrollStart, end: initialized.scrollEnd })
  await page.waitForTimeout(600)

  const afterScroll = await page.evaluate(() => ({
    currentFrameIndex: window.__truckEngineTest.engine.getCurrentFrameIndex(),
    bitmapCreations: window.__truckBitmapCreations,
    canvasDraws: window.__truckCanvasDraws,
  }))

  await page.evaluate((end) => {
    window.scrollTo({ top: end, behavior: 'instant' })
  }, initialized.scrollEnd)
  await page.waitForTimeout(600)
  const afterForwardScroll = await page.evaluate(() => ({
    currentFrameIndex: window.__truckEngineTest.engine.getCurrentFrameIndex(),
    bitmapCreations: window.__truckBitmapCreations,
    canvasDraws: window.__truckCanvasDraws,
  }))

  await page.evaluate((start) => {
    window.scrollTo({ top: start, behavior: 'instant' })
  }, initialized.scrollStart)
  await page.waitForTimeout(600)
  const afterBackwardScroll = await page.evaluate(() => ({
    currentFrameIndex: window.__truckEngineTest.engine.getCurrentFrameIndex(),
    bitmapCreations: window.__truckBitmapCreations,
    canvasDraws: window.__truckCanvasDraws,
  }))

  const responsiveResults = []

  for (const width of [320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({
      width,
      height: width < 768 ? 844 : 900,
    })
    await page.waitForTimeout(400)
    responsiveResults.push(
      await page.evaluate(() => {
        const canvas = document.querySelector('#truck-engine-canvas')
        const bounds = canvas.getBoundingClientRect()
        return {
          viewportWidth: window.innerWidth,
          cssWidth: bounds.width,
          cssHeight: bounds.height,
          renderWidth: canvas.width,
          renderHeight: canvas.height,
          bitmapCreations: window.__truckBitmapCreations,
        }
      }),
    )
  }

  await page.evaluate(() => {
    const state = window.__truckEngineTest
    state.engine.destroy()
  })
  await page.waitForTimeout(100)

  const afterDestroy = await page.evaluate(() => {
    const state = window.__truckEngineTest
    window.__truckLongTaskObserver?.disconnect()
    return {
      currentFrameIndex: state.engine.getCurrentFrameIndex(),
      scrollDriven: state.engine.isScrollDriven(),
      bitmapCreations: window.__truckBitmapCreations,
      bitmapCloses: window.__truckBitmapCloses,
      maximumLongTask:
        window.__truckLongTasks.length > 0
          ? Math.max(...window.__truckLongTasks)
          : 0,
    }
  })

  const reducedMotionPage = await browser.newPage()
  await preparePage(reducedMotionPage, 'reduce')
  const reducedMotionResult = await reducedMotionPage.evaluate(async () => {
    const { TruckAnimationEngine } = await import(
      '/src/lib/truck-sequence/TruckAnimationEngine.ts'
    )
    const engine = new TruckAnimationEngine({
      canvas: document.querySelector('#truck-engine-canvas'),
      trigger: document.querySelector('#truck-engine-trigger'),
    })
    await engine.init()
    window.scrollTo(0, 1200)
    await new Promise((resolve) => window.setTimeout(resolve, 200))
    const result = {
      frameIndex: engine.getCurrentFrameIndex(),
      scrollDriven: engine.isScrollDriven(),
    }
    engine.destroy()
    return result
  })

  const checks = {
    loadedAllFrames:
      initialized.result.mode === 'sequence' &&
      initialized.result.frameCount === 121,
    renderedFirstFrame: initialized.currentFrameIndex === 0,
    renderedCanvas:
      initialized.canvasWidth > 0 &&
      initialized.canvasHeight > 0 &&
      initialized.canvasWidth / initialized.canvasHeight === 16 / 9,
    createdOwnedTrigger: initialized.scrollDriven,
    pinnedOwnedTrigger: initialized.pinned,
    avoidedSameFrameWork:
      afterSameFrameRequest.currentFrameIndex === 0 &&
      afterSameFrameRequest.bitmapCreations === initialized.bitmapCreations &&
      afterSameFrameRequest.canvasDraws === initialized.canvasDraws,
    mappedScrollToMiddle:
      afterScroll.currentFrameIndex >= 57 &&
      afterScroll.currentFrameIndex <= 63,
    mappedScrollToLast: afterForwardScroll.currentFrameIndex === 120,
    mappedReverseScrollToFirst: afterBackwardScroll.currentFrameIndex === 0,
    boundedReverseDecodeWork:
      afterBackwardScroll.bitmapCreations -
        afterForwardScroll.bitmapCreations <=
      2,
    responsiveCanvasStable: responsiveResults.every(
      (result) =>
        result.cssWidth <= result.viewportWidth &&
        Math.abs(result.cssWidth / result.cssHeight - 16 / 9) < 0.01 &&
        Math.abs(result.renderWidth / result.renderHeight - 16 / 9) < 0.01,
    ),
    cleanedOwnedTrigger: !afterDestroy.scrollDriven,
    releasedRenderer: afterDestroy.currentFrameIndex === null,
    releasedEveryBitmap:
      afterDestroy.bitmapCloses === afterDestroy.bitmapCreations,
    stayedWithinLongTaskBudget: afterDestroy.maximumLongTask < 100,
    reducedMotionStayedStatic:
      reducedMotionResult.frameIndex === 0 &&
      !reducedMotionResult.scrollDriven,
    usedNumericNames:
      requestedSequenceFiles.some((path) => path.endsWith('/0001.webp')) &&
      requestedSequenceFiles.some((path) => path.endsWith('/0121.webp')) &&
      requestedSequenceFiles.every((path) => !path.includes('/truck_')),
    noRuntimeErrors: runtimeErrors.length === 0,
  }

  if (Object.values(checks).some((check) => !check)) {
    throw new Error(
      `Truck Animation Engine verification failed: ${JSON.stringify({
        checks,
      initialized,
      afterSameFrameRequest,
      afterScroll,
      afterForwardScroll,
      afterBackwardScroll,
      afterDestroy,
      reducedMotionResult,
      responsiveResults,
      runtimeErrors,
      })}`,
    )
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        checks,
        initialized,
        afterSameFrameRequest,
        afterScroll,
        afterForwardScroll,
        afterBackwardScroll,
        afterDestroy,
        reducedMotionResult,
        responsiveResults,
        requestedSequenceFiles: requestedSequenceFiles.length,
        browser: browserName,
      },
      null,
      2,
    )}\n`,
  )
} finally {
  await browser.close()
}
