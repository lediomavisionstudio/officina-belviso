import { useRef, useState } from 'react'
import type { GoogleReview } from '../../types/site'
import { useReviewTransition } from '../../motion/useReviewTransition'
import { Button, ButtonLink } from '../ui/Button'

type GoogleReviewsCardProps = {
  profileUrl: string | null
  rating: number
  reviewCount: number
  reviews: readonly GoogleReview[]
  writeReviewUrl: string | null
}

function GoogleAction({ href, children }: { href: string | null; children: string }) {
  if (href) {
    return (
      <ButtonLink href={href} target="_blank" rel="noopener noreferrer" size="small" variant="outline">
        {children}
      </ButtonLink>
    )
  }

  return (
    <Button
      disabled
      size="small"
      variant="outline"
      aria-describedby="google-business-link-status"
    >
      {children}
    </Button>
  )
}

export function GoogleReviewsCard({
  profileUrl,
  rating,
  reviewCount,
  reviews,
  writeReviewUrl,
}: GoogleReviewsCardProps) {
  const [activeReview, setActiveReview] = useState(0)
  const reviewsRef = useRef<HTMLElement>(null)
  const changeReview = useReviewTransition(
    reviewsRef,
    activeReview,
    setActiveReview,
  )
  const review = reviews[activeReview]
  const visibleStars = review ? Math.min(5, Math.max(0, Math.round(review.rating))) : 0
  const aggregateStars = Math.min(5, Math.max(0, Math.round(rating)))

  return (
    <section
      className="google-reviews"
      aria-labelledby="google-reviews-title"
      ref={reviewsRef}
    >
      <div className="google-reviews__heading">
        <div>
          <p className="business-card__label">Recensioni Google</p>
          <h3 id="google-reviews-title">La voce dei clienti</h3>
        </div>
        <div className="google-reviews__score" aria-label={`${rating} su 5, basato su ${reviewCount} recensioni Google`}>
          <span className="google-reviews__stars" aria-hidden="true">★★★★★</span>
          <strong>{rating.toLocaleString('it-IT')} / 5</strong>
          <span>Basato su {reviewCount} recensioni Google</span>
        </div>
      </div>

      <div className="google-reviews__carousel" aria-live="polite">
        <article className="google-review" key={review ? activeReview : 'empty'}>
          {review ? (
            <>
            <span className="google-review__stars" aria-label={`${review.rating} stelle su 5`} role="img">
              {'★'.repeat(visibleStars)}
            </span>
            <blockquote>{review.text}</blockquote>
            <p>{review.author}</p>
            </>
          ) : (
            <>
              <span className="google-review__stars" aria-label={`${rating} stelle su 5`} role="img">
                {'★'.repeat(aggregateStars)}
              </span>
              <blockquote>
                Le recensioni dei clienti sono disponibili sulla scheda Google pubblica di Officina Belviso.
              </blockquote>
              <p>{reviewCount} recensioni Google verificate</p>
            </>
          )}
        </article>
        {reviews.length !== 1 ? (
          <div className="google-reviews__controls">
            <span aria-hidden="true">
              {review ? `${activeReview + 1} / ${reviews.length}` : `${reviewCount} recensioni`}
            </span>
            <div>
              <Button
                type="button"
                size="small"
                variant="ghost"
                aria-label="Recensione precedente"
                disabled={!review}
                onClick={() =>
                  changeReview((activeReview - 1 + reviews.length) % reviews.length)
                }
              >
                ←
              </Button>
              <Button
                type="button"
                size="small"
                variant="ghost"
                aria-label="Recensione successiva"
                disabled={!review}
                onClick={() =>
                  changeReview((activeReview + 1) % reviews.length)
                }
              >
                →
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <p className="google-reviews__status" id="google-business-link-status">
        I collegamenti aprono la scheda Google pubblica di Officina Belviso in una nuova scheda.
      </p>
      <div className="google-reviews__actions">
        <GoogleAction href={profileUrl}>Leggi tutte le recensioni</GoogleAction>
        <GoogleAction href={writeReviewUrl}>Scrivi una recensione</GoogleAction>
      </div>
    </section>
  )
}
