import { useEffect, useState, type CSSProperties } from 'react'
import {
  ABOUT_CAROUSEL_INTERVAL_MS,
  aboutImages,
} from '../../config/aboutImages'

const portraitRatio = { '--placeholder-ratio': '4 / 5' } as CSSProperties

export function AboutImageCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoplayCycle, setAutoplayCycle] = useState(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % aboutImages.length)
    }, ABOUT_CAROUSEL_INTERVAL_MS)

    return () => window.clearTimeout(timeout)
  }, [activeIndex, autoplayCycle])

  const selectSlide = (index: number) => {
    setActiveIndex(index)
    setAutoplayCycle((cycle) => cycle + 1)
  }

  return (
    <figure
      className="placeholder-image home-about__image about-image-carousel"
      style={portraitRatio}
      role="region"
      aria-roledescription="carosello"
      aria-label="Immagini della storia di Officina Belviso"
      data-about-carousel
    >
      <div className="placeholder-image__media about-image-carousel__media">
        {aboutImages.map((image, index) => {
          const isActive = index === activeIndex

          return (
            <img
              className="about-image-carousel__slide"
              src={image.src}
              alt={isActive ? image.alt : ''}
              aria-hidden={!isActive}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              style={{ objectPosition: image.objectPosition }}
              data-placeholder-photo
              data-about-slide={image.id}
              data-active={isActive ? 'true' : 'false'}
            />
          )
        })}
        <span className="placeholder-image__reveal-cover" aria-hidden="true" />
        <div className="about-image-carousel__indicators" aria-label="Seleziona una foto">
          {aboutImages.map((image, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={image.id}
                className="about-image-carousel__indicator"
                type="button"
                aria-label={`Mostra foto ${index + 1}: ${image.label}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => selectSlide(index)}
              >
                <span aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>
    </figure>
  )
}
