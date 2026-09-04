import { useEffect, useId, useRef, useState } from 'react'
import {
  consentCategoryDetails,
  type ConsentCategories,
  type ConsentCategory,
} from '../../config/cookieConsent'
import { Button } from '../ui/Button'

type CookieConsentDialogProps = {
  categories: ConsentCategories
  hasStoredConsent: boolean
  onAcceptAll: () => void
  onClose: () => void
  onCustomize: () => void
  onReject: () => void
  onSave: (categories: ConsentCategories) => void
  view: 'banner' | 'preferences'
}

const optionalCategories = [
  'preferences',
  'analytics',
  'marketing',
  'externalMedia',
] as const satisfies readonly ConsentCategory[]

export function CookieConsentDialog({
  categories,
  hasStoredConsent,
  onAcceptAll,
  onClose,
  onCustomize,
  onReject,
  onSave,
  view,
}: CookieConsentDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const [draft, setDraft] = useState(categories)

  useEffect(() => {
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    return () => restoreFocusRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled)',
        )
        ?.focus({ preventScroll: true })
    })
  }, [view])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled)',
        ),
      )
      const first = focusable[0]
      const last = focusable.at(-1)

      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="cookie-consent-layer" data-cookie-consent-layer>
      <div
        className={`cookie-consent cookie-consent--${view}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={panelRef}
      >
        <button
          className="cookie-consent__close"
          type="button"
          aria-label={
            hasStoredConsent
              ? 'Chiudi gestione cookie senza modificare le preferenze'
              : 'Chiudi e rifiuta i cookie non necessari'
          }
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>

        {view === 'banner' ? (
          <>
            <p className="eyebrow">Preferenze cookie</p>
            <h2 id={titleId}>La tua privacy, le tue scelte.</h2>
            <div id={descriptionId} className="cookie-consent__description">
              <p>
                Utilizziamo cookie tecnici necessari e, con il tuo consenso,
                strumenti opzionali per funzionalità esterne, statistiche e
                marketing.
              </p>
              <p>Puoi modificare le tue preferenze in qualsiasi momento.</p>
            </div>
            <p className="cookie-consent__policies">
              <a href="/cookie-policy">Cookie Policy</a>
              <a href="/privacy-policy">Privacy Policy</a>
            </p>
            <div className="cookie-consent__actions">
              <Button type="button" variant="outline" onClick={onReject}>
                Rifiuta non necessari
              </Button>
              <Button type="button" variant="outline" onClick={onCustomize}>
                Personalizza
              </Button>
              <Button type="button" className="cookie-consent__accept" onClick={onAcceptAll}>
                Accetta tutti
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">Centro preferenze</p>
            <h2 id={titleId}>Personalizza i cookie</h2>
            <p id={descriptionId} className="cookie-consent__description">
              Le categorie opzionali sono disattivate per impostazione
              predefinita. Puoi modificare questa scelta in qualsiasi momento.
            </p>
            <div className="cookie-preferences">
              <div className="cookie-preferences__item">
                <div>
                  <h3>{consentCategoryDetails.necessary.label}</h3>
                  <p>{consentCategoryDetails.necessary.description}</p>
                </div>
                <label className="cookie-toggle">
                  <span>Sempre attivi</span>
                  <input type="checkbox" checked disabled />
                </label>
              </div>
              {optionalCategories.map((category) => (
                <div className="cookie-preferences__item" key={category}>
                  <div>
                    <h3>{consentCategoryDetails[category].label}</h3>
                    <p>{consentCategoryDetails[category].description}</p>
                  </div>
                  <label className="cookie-toggle">
                    <span>
                      {draft[category] ? 'Attivi' : 'Disattivati'}
                    </span>
                    <input
                      type="checkbox"
                      checked={draft[category]}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          [category]: event.target.checked,
                        }))
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
            <div className="cookie-consent__actions cookie-consent__actions--preferences">
              <Button type="button" variant="outline" onClick={onReject}>
                Rifiuta non necessari
              </Button>
              <Button type="button" className="cookie-consent__accept" onClick={() => onSave(draft)}>
                Salva preferenze
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
