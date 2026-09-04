import {
  getTruckSequenceFramePath,
  truckSequenceConfig,
  type TruckSequenceExtension,
} from '../../config/truck-sequence.config'

export type TruckSequenceMode = 'sequence' | 'static'

export type TruckSequenceFrame = Readonly<{
  index: number
  frameNumber: number
  sourceFrameNumber: number
  source: string
  blob: Blob
  width: number
  height: number
  extension: TruckSequenceExtension | 'static'
  isFallback: boolean
  isSubstitute: boolean
}>

export type TruckSequenceLoadResult = Readonly<{
  mode: TruckSequenceMode
  frameCount: number
  extension: TruckSequenceExtension | 'static'
  width: number
  height: number
  substitutedFrameNumbers: readonly number[]
}>

type DecodedFrame = Readonly<{
  blob: Blob
  width: number
  height: number
}>

class TruckSequenceValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TruckSequenceValidationError'
  }
}

export class TruckSequenceLoader {
  private abortController: AbortController | null = null
  private frames: TruckSequenceFrame[] = []
  private loadPromise: Promise<TruckSequenceLoadResult> | null = null
  private loadResult: TruckSequenceLoadResult | null = null

  load(): Promise<TruckSequenceLoadResult> {
    if (this.loadResult) {
      return Promise.resolve(this.loadResult)
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    const controller = new AbortController()
    this.abortController = controller
    const operation = this.loadAvailableSource(controller)
    this.loadPromise = operation

    return operation.finally(() => {
      if (this.loadPromise === operation) {
        this.loadPromise = null
      }

      if (this.abortController === controller) {
        this.abortController = null
      }
    })
  }

  getFrame(index: number): TruckSequenceFrame {
    if (!this.loadResult) {
      throw new Error('Truck sequence is not loaded. Call load() first.')
    }

    if (!Number.isInteger(index) || index < 0 || index >= this.frames.length) {
      throw new RangeError(
        `Truck sequence index must be an integer between 0 and ${this.frames.length - 1}`,
      )
    }

    return this.frames[index]
  }

  getProgressFrame(progress: number): TruckSequenceFrame {
    if (!Number.isFinite(progress)) {
      throw new TypeError('Truck sequence progress must be a finite number.')
    }

    if (!this.loadResult) {
      throw new Error('Truck sequence is not loaded. Call load() first.')
    }

    const normalizedProgress = Math.min(1, Math.max(0, progress))
    const index = Math.round(normalizedProgress * (this.frames.length - 1))

    return this.getFrame(index)
  }

  isLoaded(): boolean {
    return this.loadResult !== null
  }

  release(): void {
    this.abortController?.abort()
    this.abortController = null
    this.revokeFrames(this.frames)
    this.frames = []
    this.loadResult = null
  }

  private async loadAvailableSource(
    controller: AbortController,
  ): Promise<TruckSequenceLoadResult> {
    const validationErrors: Error[] = []

    for (const extension of truckSequenceConfig.extensionPriority) {
      try {
        const sequence = await this.loadSequence(extension, controller)

        if (sequence) {
          return this.commitFrames(sequence, extension, 'sequence', controller)
        }
      } catch (error) {
        if (controller.signal.aborted) {
          throw error
        }

        validationErrors.push(
          error instanceof Error ? error : new Error(String(error)),
        )
      }
    }

    if (validationErrors.length > 0) {
      throw new AggregateError(
        validationErrors,
        'Truck sequence validation failed for every available format.',
      )
    }

    const fallback = await this.loadStaticFallback(controller)
    return this.commitFrames([fallback], 'static', 'static', controller)
  }

  private async loadSequence(
    extension: TruckSequenceExtension,
    controller: AbortController,
  ): Promise<TruckSequenceFrame[] | null> {
    const firstFrameNumber = truckSequenceConfig.firstFrame
    const probeCache = new Map<number, DecodedFrame | null>()
    const seedFrame = await this.findAvailableSeedFrame(
      extension,
      probeCache,
      controller,
    )

    if (!seedFrame) {
      return null
    }

    const frameCount = truckSequenceConfig.frameCount
    const decodedFrames = new Array<DecodedFrame | null>(frameCount).fill(null)
    let cursor = 0

    const worker = async () => {
      while (cursor < frameCount) {
        const index = cursor
        cursor += 1
        const frameNumber = firstFrameNumber + index

        try {
          const decoded =
            probeCache.get(frameNumber) ??
            (await this.fetchAndDecode(
              getTruckSequenceFramePath(frameNumber, extension),
              extension,
              controller,
            ))
          decodedFrames[index] = decoded

          if (!decoded) {
            this.logDevelopmentWarning(
              `Frame ${frameNumber} could not be loaded and will be substituted.`,
            )
          }
        } catch (error) {
          if (controller.signal.aborted) {
            throw error
          }

          this.logDevelopmentWarning(
            `Frame ${frameNumber} could not be loaded and will be substituted.`,
            error,
          )
          decodedFrames[index] = null
        }
      }
    }

    const workerCount = Math.min(
      truckSequenceConfig.preload.concurrency,
      frameCount,
    )
    const results = await Promise.allSettled(
      Array.from({ length: workerCount }, () => worker()),
    )
    const failure = results.find(
      (result): result is PromiseRejectedResult =>
        result.status === 'rejected',
    )

    if (failure) {
      throw failure.reason
    }

    const validDimensions = new Map<string, number>()

    decodedFrames.forEach((frame) => {
      if (frame) {
        const dimensions = `${frame.width}x${frame.height}`
        validDimensions.set(
          dimensions,
          (validDimensions.get(dimensions) ?? 0) + 1,
        )
      }
    })

    const canonicalDimensions = [...validDimensions.entries()].sort(
      (left, right) => right[1] - left[1],
    )[0]?.[0]

    if (!canonicalDimensions) {
      return null
    }

    decodedFrames.forEach((frame, index) => {
      if (
        frame &&
        `${frame.width}x${frame.height}` !== canonicalDimensions
      ) {
        this.logDevelopmentWarning(
          `Frame ${firstFrameNumber + index} has inconsistent dimensions and will be substituted.`,
        )
        decodedFrames[index] = null
      }
    })

    return decodedFrames.map((decoded, index) => {
      const replacementIndex =
        decoded === null
          ? this.findNearestValidFrameIndex(decodedFrames, index)
          : index
      const sourceFrame = decodedFrames[replacementIndex]

      if (!sourceFrame) {
        throw new Error('Truck sequence has no usable frame for substitution.')
      }

      const frameNumber = firstFrameNumber + index
      return this.createFrame(
        sourceFrame,
        index,
        frameNumber,
        firstFrameNumber + replacementIndex,
        extension,
        false,
        decoded === null,
      )
    })
  }

  private async findAvailableSeedFrame(
    extension: TruckSequenceExtension,
    probeCache: Map<number, DecodedFrame | null>,
    controller: AbortController,
  ): Promise<DecodedFrame | null> {
    const firstFrameNumber = truckSequenceConfig.firstFrame
    const seedCandidates = [
      firstFrameNumber,
      firstFrameNumber + Math.floor(truckSequenceConfig.frameCount / 2),
      truckSequenceConfig.lastFrame,
    ]

    for (const frameNumber of seedCandidates) {
      try {
        const decoded = await this.fetchAndDecode(
          getTruckSequenceFramePath(frameNumber, extension),
          extension,
          controller,
        )
        probeCache.set(frameNumber, decoded)

        if (decoded) {
          return decoded
        }
      } catch (error) {
        if (controller.signal.aborted) {
          throw error
        }

        this.logDevelopmentWarning(
          `Unable to probe ${extension.toUpperCase()} frame ${frameNumber}.`,
          error,
        )
        probeCache.set(frameNumber, null)
      }
    }

    return null
  }

  private async loadStaticFallback(
    controller: AbortController,
  ): Promise<TruckSequenceFrame> {
    const decoded = await this.fetchAndDecode(
      truckSequenceConfig.fallback.staticImagePath,
      'static',
      controller,
    )

    if (!decoded) {
      throw new Error(
        'Truck sequence is unavailable and the static truck fallback could not be loaded.',
      )
    }

    return this.createFrame(decoded, 0, 1, 1, 'static', true, false)
  }

  private async fetchAndDecode(
    source: string,
    expectedExtension: TruckSequenceExtension | 'static',
    controller: AbortController,
  ): Promise<DecodedFrame | null> {
    const response = await fetch(source, {
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const blob = await response.blob()
    const metadata = await this.detectImageMetadata(blob)

    if (!metadata) {
      return null
    }

    if (
      expectedExtension !== 'static' &&
      metadata.extension !== expectedExtension
    ) {
      throw new TruckSequenceValidationError(
        `${source} contains ${metadata.extension.toUpperCase()} data but uses the .${expectedExtension} extension.`,
      )
    }

    return {
      blob,
      width: metadata.width,
      height: metadata.height,
    }
  }

  private async detectImageMetadata(
    blob: Blob,
  ): Promise<{
    extension: TruckSequenceExtension
    width: number
    height: number
  } | null> {
    const bytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer())
    const isPng =
      bytes.length >= 24 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    const isWebp =
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'

    if (isPng) {
      const view = new DataView(bytes.buffer)
      return {
        extension: 'png',
        width: view.getUint32(16),
        height: view.getUint32(20),
      }
    }

    if (!isWebp) {
      return null
    }

    const chunkType = String.fromCharCode(...bytes.slice(12, 16))

    if (chunkType === 'VP8X' && bytes.length >= 30) {
      return {
        extension: 'webp',
        width:
          1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        height:
          1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      }
    }

    if (
      chunkType === 'VP8L' &&
      bytes.length >= 25 &&
      bytes[20] === 0x2f
    ) {
      return {
        extension: 'webp',
        width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
        height:
          1 +
          (bytes[22] >> 6) +
          (bytes[23] << 2) +
          ((bytes[24] & 0x0f) << 10),
      }
    }

    if (
      chunkType === 'VP8 ' &&
      bytes.length >= 30 &&
      bytes[23] === 0x9d &&
      bytes[24] === 0x01 &&
      bytes[25] === 0x2a
    ) {
      return {
        extension: 'webp',
        width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
        height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
      }
    }

    return null
  }

  private createFrame(
    decoded: DecodedFrame,
    index: number,
    frameNumber: number,
    sourceFrameNumber: number,
    extension: TruckSequenceExtension | 'static',
    isFallback: boolean,
    isSubstitute: boolean,
  ): TruckSequenceFrame {
    return Object.freeze({
      index,
      frameNumber,
      sourceFrameNumber,
      source: URL.createObjectURL(decoded.blob),
      blob: decoded.blob,
      width: decoded.width,
      height: decoded.height,
      extension,
      isFallback,
      isSubstitute,
    })
  }

  private commitFrames(
    frames: TruckSequenceFrame[],
    extension: TruckSequenceExtension | 'static',
    mode: TruckSequenceMode,
    controller: AbortController,
  ): TruckSequenceLoadResult {
    if (controller.signal.aborted || this.abortController !== controller) {
      this.revokeFrames(frames)
      throw new DOMException(
        'Truck sequence loading was aborted',
        'AbortError',
      )
    }

    const firstFrame = frames[0]
    const result = Object.freeze({
      mode,
      frameCount: frames.length,
      extension,
      width: firstFrame.width,
      height: firstFrame.height,
      substitutedFrameNumbers: Object.freeze(
        frames
          .filter((frame) => frame.isSubstitute)
          .map((frame) => frame.frameNumber),
      ),
    })

    this.frames = frames
    this.loadResult = result
    return result
  }

  private revokeFrames(frames: TruckSequenceFrame[]): void {
    frames.forEach((frame) => URL.revokeObjectURL(frame.source))
  }

  private findNearestValidFrameIndex(
    frames: Array<DecodedFrame | null>,
    targetIndex: number,
  ): number {
    for (let distance = 1; distance < frames.length; distance += 1) {
      const previousIndex = targetIndex - distance
      const nextIndex = targetIndex + distance

      if (previousIndex >= 0 && frames[previousIndex]) {
        return previousIndex
      }

      if (nextIndex < frames.length && frames[nextIndex]) {
        return nextIndex
      }
    }

    throw new Error('Truck sequence contains no valid frames.')
  }

  private logDevelopmentWarning(message: string, error?: unknown): void {
    const environment = (
      import.meta as ImportMeta & {
        env?: {
          DEV?: boolean
        }
      }
    ).env

    if (environment?.DEV) {
      console.warn(`[TruckSequenceLoader] ${message}`, error ?? '')
    }
  }
}
