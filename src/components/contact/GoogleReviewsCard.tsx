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
      <ButtonLink href={href} target="_blank" rel="noreferrer" size="small" variant="outline">
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

      {review ? (
        <div className="google-reviews__carousel" aria-live="polite">
          <article className="google-review" key={activeReview}>
            <span className="google-review__stars" aria-label={`${review.rating} stelle su 5`} role="img">
              {'★'.repeat(visibleStars)}
            </span>
            <blockquote>{review.text}</blockquote>
            <p>{review.author}</p>
          </article>
          {reviews.length > 1 ? (
            <div className="google-reviews__controls">
              <span aria-hidden="true">{activeReview + 1} / {reviews.length}</span>
              <div>
                <Button
                  type="button"
                  size="small"
                  variant="ghost"
                  aria-label="Recensione precedente"
                  disabled={activeReview === 0}
                  onClick={() => changeReview(Math.max(0, activeReview - 1))}
                >
                  ←
                </Button>
                <Button
                  type="button"
                  size="small"
                  variant="ghost"
                  aria-label="Recensione successiva"
                  disabled={activeReview === reviews.length - 1}
                  onClick={() =>
                    changeReview(Math.min(reviews.length - 1, activeReview + 1))
                  }
                >
                  →
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="google-reviews__status" id="google-business-link-status">
        Il collegamento al profilo Google Business verrà attivato dopo la configurazione.
      </p>
      <div className="google-reviews__actions">
        <GoogleAction href={profileUrl}>Leggi tutte le recensioni</GoogleAction>
        <GoogleAction href={writeReviewUrl}>Scrivi una recensione</GoogleAction>
      </div>
    </section>
  )
}
