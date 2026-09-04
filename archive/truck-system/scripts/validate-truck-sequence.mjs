import { chromium } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const sequenceDirectory = path.resolve(
  process.argv[2] ?? 'public/assets/truck-sequence',
)
const maximumFrameCount = 240
const validFilePattern = /^(\d{4})\.(webp|png)$/i
const allowedDocumentation = new Set(['README.md'])
const entries = await readdir(sequenceDirectory, { withFileTypes: true })
const errors = []
const warnings = []
const candidates = []

for (const entry of entries) {
  if (!entry.isFile()) {
    errors.push(`Unexpected directory: ${entry.name}`)
    continue
  }

  if (allowedDocumentation.has(entry.name)) {
    continue
  }

  const match = entry.name.match(validFilePattern)

  if (!match) {
    errors.push(`Invalid file name or extension: ${entry.name}`)
    continue
  }

  candidates.push({
    name: entry.name,
    number: Number(match[1]),
    extension: match[2].toLowerCase(),
    path: path.join(sequenceDirectory, entry.name),
  })
}

if (candidates.length === 0) {
  errors.push('No numbered WebP or PNG frames were found.')
}

if (candidates.length > maximumFrameCount) {
  errors.push(
    `Sequence contains ${candidates.length} frames; maximum is ${maximumFrameCount}.`,
  )
}

const frameNumbers = new Map()
const extensions = new Set()

for (const candidate of candidates) {
  extensions.add(candidate.extension)
  const duplicates = frameNumbers.get(candidate.number) ?? []
  duplicates.push(candidate.name)
  frameNumbers.set(candidate.number, duplicates)
}

for (const [frameNumber, duplicates] of frameNumbers) {
  if (duplicates.length > 1) {
    errors.push(
      `Duplicate frame ${String(frameNumber).padStart(4, '0')}: ${duplicates.join(', ')}`,
    )
  }
}

if (extensions.size > 1) {
  errors.push('Mixed WebP and PNG sequences are not allowed.')
}

const sortedFrames = [...candidates].sort(
  (left, right) => left.number - right.number,
)

sortedFrames.forEach((frame, index) => {
  const expectedNumber = index + 1

  if (frame.number !== expectedNumber) {
    errors.push(
      `Missing or out-of-order frame: expected ${String(expectedNumber).padStart(4, '0')}, found ${frame.name}.`,
    )
  }
})

function detectFormat(buffer) {
  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'

  if (isWebp) return 'webp'
  if (isPng) return 'png'
  return null
}

if (sortedFrames.length > 0) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const dimensions = new Set()
  const contentHashes = new Map()

  try {
    for (const frame of sortedFrames) {
      const buffer = await readFile(frame.path)
      const detectedFormat = detectFormat(buffer)

      if (detectedFormat !== frame.extension) {
        errors.push(
          `${frame.name} contains ${detectedFormat ?? 'unknown'} data instead of ${frame.extension}.`,
        )
        continue
      }

      const hash = createHash('sha256').update(buffer).digest('hex')
      const matchingFrame = contentHashes.get(hash)

      if (matchingFrame) {
        warnings.push(
          `${frame.name} has identical image data to ${matchingFrame}.`,
        )
      } else {
        contentHashes.set(hash, frame.name)
      }

      const source = `data:image/${frame.extension};base64,${buffer.toString('base64')}`
      const metadata = await page.evaluate(async (imageSource) => {
        const response = await fetch(imageSource)
        const blob = await response.blob()
        const bitmap = await createImageBitmap(blob)
        const result = {
          width: bitmap.width,
          height: bitmap.height,
        }
        bitmap.close()
        return result
      }, source)

      dimensions.add(`${metadata.width}x${metadata.height}`)
    }
  } finally {
    await browser.close()
  }

  if (dimensions.size > 1) {
    errors.push(
      `Frame dimensions are inconsistent: ${[...dimensions].join(', ')}.`,
    )
  }

  const report = {
    directory: sequenceDirectory,
    frames: sortedFrames.length,
    extension: extensions.size === 1 ? [...extensions][0] : null,
    firstFrame: sortedFrames[0]?.name ?? null,
    lastFrame: sortedFrames.at(-1)?.name ?? null,
    dimensions: [...dimensions],
    errors,
    warnings,
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
} else {
  process.stdout.write(
    `${JSON.stringify({ directory: sequenceDirectory, errors, warnings }, null, 2)}\n`,
  )
}

if (errors.length > 0) {
  process.exitCode = 1
}
