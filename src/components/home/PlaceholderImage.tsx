import type { CSSProperties } from 'react'

type PlaceholderRatio = 'hero' | 'landscape' | 'portrait' | 'service' | 'square' | 'brand'

type PlaceholderImageProps = {
  alt: string
  caption?: string
  className?: string
  objectPosition?: string
  priority?: boolean
  ratio?: PlaceholderRatio
  sizes?: string
  src?: string
  srcSet?: string
}

const ratioMap: Record<PlaceholderRatio, string> = {
  hero: '4 / 5',
  landscape: '16 / 10',
  portrait: '4 / 5',
  service: '16 / 11',
  square: '1 / 1',
  brand: '3 / 2',
}

export function PlaceholderImage({
  alt,
  caption,
  className = '',
  objectPosition = 'center',
  priority = false,
  ratio = 'landscape',
  sizes,
  src,
  srcSet,
}: PlaceholderImageProps) {
  const style = { '--placeholder-ratio': ratioMap[ratio] } as CSSProperties
  const responsiveSizes =
    sizes ??
    (ratio === 'hero'
      ? '100vw'
      : ratio === 'portrait'
        ? '(max-width: 960px) calc(100vw - 40px), 42vw'
        : '(max-width: 620px) calc(100vw - 40px), (max-width: 960px) calc(50vw - 48px), 31vw')

  return (
    <figure className={`placeholder-image ${className}`.trim()} style={style}>
      <div className="placeholder-image__media">
        {src ? (
          <img
            src={src}
            srcSet={srcSet}
            sizes={srcSet ? responsiveSizes : undefined}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            style={{ objectPosition }}
            data-placeholder-photo
          />
        ) : (
          <div
            className="placeholder-image__empty"
            role="img"
            aria-label={alt}
            data-image-placeholder
          >
            <span aria-hidden="true">
              {ratio === 'brand' ? 'Marchio assistito' : 'Immagine in aggiornamento'}
            </span>
          </div>
        )}
        <span className="placeholder-image__reveal-cover" aria-hidden="true" />
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
