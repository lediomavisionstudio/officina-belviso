import { siteConfig } from '../../config/site'
import { useCookieConsent } from '../../hooks/useCookieConsent'
import { Button, ButtonLink } from '../ui/Button'
import { GoogleReviewsCard } from './GoogleReviewsCard'

type WorkshopBusinessCardProps = {
  titleId: string
}

type ContactIconName = 'address' | 'email' | 'hours' | 'phone'

function ContactIcon({ name }: { name: ContactIconName }) {
  const paths = {
    address: <><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    hours: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    phone: <path d="M7.4 3.5 4.8 5.2c-.8.5-1.1 1.5-.8 2.4 1.8 5.5 6.1 9.8 11.6 11.6.9.3 1.9 0 2.4-.8l1.7-2.6-4.1-2-1.5 1.7a13.5 13.5 0 0 1-5.6-5.6l1.7-1.5-2-4.1-.8-.8Z" />,
  }

  return (
    <svg className="business-card__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

export function WorkshopBusinessCard({ titleId }: WorkshopBusinessCardProps) {
  const { categories, enableExternalMedia } = useCookieConsent()
  const { contact, googleBusiness, googleMapsUrl, openingHours } = siteConfig
  const phoneHref = contact.phone ? `tel:${contact.phone.replace(/\D/g, '')}` : null
  const googleMapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    `${contact.companyName} ${contact.address.join(' ')}`,
  )}&output=embed`
  const weekdayHours = openingHours[0]?.periods.join(' • ')
  const saturdayHours = openingHours
    .find(({ day }) => day === 'Sabato')
    ?.periods.join(' • ')
  const sundayHours = openingHours
    .find(({ day }) => day === 'Domenica')
    ?.periods.join(' • ')

  return (
    <article className="business-card">
      <header className="business-card__header">
        <p className="eyebrow">Informazioni officina</p>
        <h2 id={titleId}>Richiedi un preventivo</h2>
        <p>Tutto ciò che serve per contattarci e raggiungerci.</p>
      </header>

      <div className="business-card__details">
        <section className="business-card__detail business-card__detail--address" aria-labelledby="workshop-address-title">
          <ContactIcon name="address" />
          <div>
            <h3 id="workshop-address-title" className="business-card__label">Indirizzo</h3>
            <div className="business-map">
              <div className="business-map__embed">
                {categories.externalMedia ? (
                  <iframe
                    src={googleMapsEmbedUrl}
                    title="Mappa di Officina Belviso"
                    loading="eager"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                ) : (
                  <div className="business-map__consent" role="region" aria-label="Google Maps disattivato">
                    <p>
                      Google Maps è disattivato finché non autorizzi i contenuti esterni.
                    </p>
                    <Button type="button" size="small" variant="outline" onClick={enableExternalMedia}>
                      Consenti e mostra la mappa
                    </Button>
                  </div>
                )}
              </div>
              {googleMapsUrl ? (
                <ButtonLink href={googleMapsUrl} target="_blank" rel="noreferrer" size="small" variant="outline">
                  Apri in Maps
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </section>

        <section className="business-card__detail" aria-labelledby="workshop-phone-title">
          <ContactIcon name="phone" />
          <div>
            <h3 id="workshop-phone-title" className="business-card__label">Telefono</h3>
            {phoneHref && contact.phone ? <a href={phoneHref}>{contact.phone}</a> : <span>Numero in aggiornamento</span>}
          </div>
        </section>

        <section className="business-card__detail" aria-labelledby="workshop-email-title">
          <ContactIcon name="email" />
          <div>
            <h3 id="workshop-email-title" className="business-card__label">Email</h3>
            {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <span className="business-card__pending">Indirizzo email in aggiornamento</span>}
          </div>
        </section>

        <section className="business-card__detail business-card__detail--hours" aria-labelledby="workshop-hours-title">
          <ContactIcon name="hours" />
          <div className="site-footer__hours">
            <strong id="workshop-hours-title">Orari</strong>
            <dl>
              <div><dt>Lun–Ven</dt><dd>{weekdayHours}</dd></div>
              <div><dt>Sabato</dt><dd>{saturdayHours}</dd></div>
              <div><dt>Domenica</dt><dd>{sundayHours}</dd></div>
            </dl>
          </div>
        </section>
      </div>

      <GoogleReviewsCard {...googleBusiness} />
    </article>
  )
}
