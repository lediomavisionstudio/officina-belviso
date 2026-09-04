import { chromium } from '@playwright/test'
import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const DEFAULT_QUALITY = 0.92
const FILE_PATTERN = /^frame_(\d{4})\.png$/i
const SAMPLE_WIDTH = 160
const SAMPLE_HEIGHT = 90

function parseArguments(argv) {
  const options = {
    source: '',
    output: '',
    video: '',
    quality: DEFAULT_QUALITY,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const value = argv[index + 1]

    if (argument === '--source') {
      options.source = value ?? ''
      index += 1
    } else if (argument === '--output') {
      options.output = value ?? ''
      index += 1
    } else if (argument === '--video') {
      options.video = value ?? ''
      index += 1
    } else if (argument === '--quality') {
      options.quality = Number(value)
      index += 1
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }

  if (!options.source || !options.output) {
    throw new Error(
      'Usage: node scripts/prepare-truck-sequence.mjs --source <png-folder> --output <webp-folder> [--video <source.mp4>] [--quality 0.92]',
    )
  }

  if (
    !Number.isFinite(options.quality) ||
    options.quality <= 0 ||
    options.quality > 1
  ) {
    throw new Error('--quality must be greater than 0 and less than or equal to 1')
  }

  return options
}

function readPngHeader(buffer, fileName) {
  const pngSignature = '89504e470d0a1a0a'

  if (
    buffer.length < 26 ||
    buffer.subarray(0, 8).toString('hex') !== pngSignature
  ) {
    throw new Error(`${fileName} is not a valid PNG file`)
  }

  const width = buffer.readUInt32BE(16)
  const height = buffer.readUInt32BE(20)
  const colorType = buffer[25]

  return {
    width,
    height,
    hasAlpha: colorType === 4 || colorType === 6,
  }
}

async function inspectVideoMetadata(page, videoPath) {
  if (!videoPath) {
    return null
  }

  const videoBuffer = await readFile(videoPath)
  const source = `data:video/mp4;base64,${videoBuffer.toString('base64')}`

  return page.evaluate(async (videoSource) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = videoSource

    await new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', resolve, { once: true })
      video.addEventListener(
        'error',
        () => reject(new Error('The source video metadata could not be decoded')),
        { once: true },
      )
    })

    return {
      durationSeconds: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
    }
  }, source)
}

async function convertFrame(page, inputBuffer, quality) {
  const source = `data:image/png;base64,${inputBuffer.toString('base64')}`

  return page.evaluate(
    async ({ imageSource, outputQuality, sampleWidth, sampleHeight }) => {
      const response = await fetch(imageSource)
      const sourceBlob = await response.blob()
      const bitmap = await createImageBitmap(sourceBlob)

      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = bitmap.width
      outputCanvas.height = bitmap.height

      const outputContext = outputCanvas.getContext('2d', {
        alpha: true,
      })

      if (!outputContext) {
        bitmap.close()
        throw new Error('2D canvas is not available')
      }

      outputContext.drawImage(bitmap, 0, 0)

      const sampleCanvas = document.createElement('canvas')
      sampleCanvas.width = sampleWidth
      sampleCanvas.height = sampleHeight
      const sampleContext = sampleCanvas.getContext('2d', {
        alpha: true,
        willReadFrequently: true,
      })

      if (!sampleContext) {
        bitmap.close()
        throw new Error('2D analysis canvas is not available')
      }

      sampleContext.drawImage(bitmap, 0, 0, sampleWidth, sampleHeight)
      const pixels = sampleContext.getImageData(
        0,
        0,
        sampleWidth,
        sampleHeight,
      ).data
      const luminance = new Uint8Array(sampleWidth * sampleHeight)

      let visiblePixels = 0
      let weightedX = 0
      let weightedY = 0

      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          const pixelIndex = (y * sampleWidth + x) * 4
          const red = pixels[pixelIndex]
          const green = pixels[pixelIndex + 1]
          const blue = pixels[pixelIndex + 2]
          const alpha = pixels[pixelIndex + 3]
          const value = Math.round(
            (red * 54 + green * 183 + blue * 19) / 256,
          )
          const luminanceIndex = y * sampleWidth + x
          luminance[luminanceIndex] = value

          const isWatermarkRegion =
            x >= sampleWidth * 0.82 && y >= sampleHeight * 0.82
          const isSubjectPixel =
            !isWatermarkRegion && alpha > 16 && value >= 28

          if (isSubjectPixel) {
            visiblePixels += 1
            weightedX += x
            weightedY += y
          }
        }
      }

      const outputBlob = await new Promise((resolve, reject) => {
        outputCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('WebP encoding failed'))
            }
          },
          'image/webp',
          outputQuality,
        )
      })

      const encodedDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.addEventListener('load', () => resolve(reader.result), {
          once: true,
        })
        reader.addEventListener(
          'error',
          () => reject(new Error('WebP output could not be read')),
          { once: true },
        )
        reader.readAsDataURL(outputBlob)
      })

      bitmap.close()

      return {
        width: outputCanvas.width,
        height: outputCanvas.height,
        webpBase64: encodedDataUrl.split(',')[1],
        luminanceBase64: btoa(String.fromCharCode(...luminance)),
        subject: {
          centerX:
            visiblePixels > 0 ? weightedX / visiblePixels : sampleWidth / 2,
          centerY:
            visiblePixels > 0 ? weightedY / visiblePixels : sampleHeight / 2,
        },
      }
    },
    {
      imageSource: source,
      outputQuality: quality,
      sampleWidth: SAMPLE_WIDTH,
      sampleHeight: SAMPLE_HEIGHT,
    },
  )
}

function calculateFrameDelta(previous, current) {
  let totalDifference = 0

  for (let index = 0; index < current.length; index += 1) {
    totalDifference += Math.abs(current[index] - previous[index])
  }

  return totalDifference / current.length / 255
}

function median(values) {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const sourcePath = path.resolve(options.source)
  const outputPath = path.resolve(options.output)
  const sourceEntries = await readdir(sourcePath, { withFileTypes: true })
  const sourceFrames = sourceEntries
    .filter((entry) => entry.isFile() && FILE_PATTERN.test(entry.name))
    .map((entry) => ({
      name: entry.name,
      number: Number(entry.name.match(FILE_PATTERN)[1]),
      path: path.join(sourcePath, entry.name),
    }))
    .sort((left, right) => left.number - right.number)

  if (sourceFrames.length === 0) {
    throw new Error(`No frame_XXXX.png files found in ${sourcePath}`)
  }

  sourceFrames.forEach((frame, index) => {
    if (frame.number !== index) {
      throw new Error(
        `Frame numbering is not continuous: expected frame_${String(index).padStart(4, '0')}.png, found ${frame.name}`,
      )
    }
  })

  const existingOutputEntries = await readdir(outputPath, {
    withFileTypes: true,
  }).catch((error) => {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  })

  if (existingOutputEntries.length > 0) {
    throw new Error(
      `Output folder must be empty before conversion: ${outputPath}`,
    )
  }

  await mkdir(outputPath, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const videoMetadata = await inspectVideoMetadata(page, options.video)
  const dimensions = new Set()
  const alphaFrames = []
  const frameDeltas = []
  const centerSteps = []
  const outputSizes = []
  let sourceBytes = 0
  let previousLuminance = null
  let previousCenter = null

  try {
    for (let index = 0; index < sourceFrames.length; index += 1) {
      const frame = sourceFrames[index]
      const inputBuffer = await readFile(frame.path)
      const inputMetadata = readPngHeader(inputBuffer, frame.name)
      const inputStats = await stat(frame.path)
      sourceBytes += inputStats.size
      dimensions.add(`${inputMetadata.width}x${inputMetadata.height}`)

      if (inputMetadata.hasAlpha) {
        alphaFrames.push(frame.name)
      }

      const converted = await convertFrame(page, inputBuffer, options.quality)

      if (
        converted.width !== inputMetadata.width ||
        converted.height !== inputMetadata.height
      ) {
        throw new Error(`${frame.name} changed dimensions during conversion`)
      }

      const outputName = `${String(index + 1).padStart(4, '0')}.webp`
      const outputBuffer = Buffer.from(converted.webpBase64, 'base64')
      await writeFile(path.join(outputPath, outputName), outputBuffer, {
        flag: 'wx',
      })
      outputSizes.push(outputBuffer.length)

      const luminance = Buffer.from(converted.luminanceBase64, 'base64')

      if (previousLuminance) {
        frameDeltas.push(calculateFrameDelta(previousLuminance, luminance))
      }

      if (previousCenter) {
        centerSteps.push(
          Math.hypot(
            converted.subject.centerX - previousCenter.centerX,
            converted.subject.centerY - previousCenter.centerY,
          ),
        )
      }

      previousLuminance = luminance
      previousCenter = converted.subject

      process.stdout.write(
        `\rConverted ${String(index + 1).padStart(3, ' ')}/${sourceFrames.length}`,
      )
    }
  } finally {
    await browser.close()
    process.stdout.write('\n')
  }

  const outputBytes = outputSizes.reduce((total, size) => total + size, 0)
  const estimatedFrameRate =
    videoMetadata?.durationSeconds > 0
      ? (sourceFrames.length - 1) / videoMetadata.durationSeconds
      : null

  const report = {
    source: {
      path: sourcePath,
      frames: sourceFrames.length,
      firstFrame: sourceFrames[0].name,
      lastFrame: sourceFrames.at(-1).name,
      bytes: sourceBytes,
      dimensions: [...dimensions],
      alphaFrames: alphaFrames.length,
      video: videoMetadata,
      estimatedFrameRate,
    },
    output: {
      path: outputPath,
      frames: outputSizes.length,
      firstFrame: '0001.webp',
      lastFrame: `${String(outputSizes.length).padStart(4, '0')}.webp`,
      bytes: outputBytes,
      format: 'webp',
      quality: options.quality,
      compressionRatio: outputBytes / sourceBytes,
    },
    continuity: {
      sampleSize: `${SAMPLE_WIDTH}x${SAMPLE_HEIGHT}`,
      medianNormalizedFrameDelta: median(frameDeltas),
      maximumNormalizedFrameDelta: Math.max(...frameDeltas),
      maximumSubjectCenterStepInSamplePixels: Math.max(...centerSteps),
    },
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`)
  process.exitCode = 1
})
