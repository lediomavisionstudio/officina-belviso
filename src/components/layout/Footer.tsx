import { siteConfig } from '../../config/site'
import { useCookieConsent } from '../../hooks/useCookieConsent'
import { Container } from '../ui/Container'
import { FooterSocialLinks } from './FooterSocialLinks'

type FooterIconName = 'address' | 'email' | 'hours' | 'phone'

function FooterIcon({ name }: { name: FooterIconName }) {
  const paths = {
    address: <><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    hours: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    phone: <path d="M7.4 3.5 4.8 5.2c-.8.5-1.1 1.5-.8 2.4 1.8 5.5 6.1 9.8 11.6 11.6.9.3 1.9 0 2.4-.8l1.7-2.6-4.1-2-1.5 1.7a13.5 13.5 0 0 1-5.6-5.6l1.7-1.5-2-4.1-.8-.8Z" />,
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

export function Footer() {
  const { openPreferences } = useCookieConsent()
  const { business, contact, credits, openingHours, social } = siteConfig
  const phoneHref = contact.phone ? `tel:${contact.phone.replace(/\D/g, '')}` : null
  const weekdayHours = openingHours[0]?.periods.join(' · ')
  const saturdayHours = openingHours.find(({ day }) => day === 'Sabato')?.periods.join(' · ')
  const sundayHours = openingHours.find(({ day }) => day === 'Domenica')?.periods.join(' · ')

  return (
    <footer className="site-footer" aria-label="Piè di pagina">
      <Container className="site-footer__grid">
        <section className="site-footer__brand" aria-labelledby="footer-brand-title">
          <h2 className="site-footer__visually-hidden" id="footer-brand-title">Officina Belviso</h2>
          <div className="site-footer__logo-frame">
            <img
              src="/assets/logo-officina-belviso-ufficiale.png"
              alt={siteConfig.name}
              width="1536"
              height="1024"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p>{siteConfig.description}</p>
          <FooterSocialLinks links={social} />
        </section>

        <section className="site-footer__column" aria-labelledby="footer-business-title">
          <h2 id="footer-business-title">Dati aziendali</h2>
          <dl className="site-footer__business-data">
            <div><dt>Codice Fiscale</dt><dd>{business.fiscalCode}</dd></div>
            <div><dt>Partita IVA</dt><dd>{business.vatNumber}</dd></div>
            <div>
              <dt>PEC</dt>
              <dd>
                <a href={`mailto:${business.pec}`} aria-label={`Invia una PEC a ${business.pec}`}>
                  {business.pec}
                </a>
              </dd>
            </div>
            <div><dt>Codice Univoco</dt><dd>{business.recipientCode}</dd></div>
          </dl>
        </section>

        <section className="site-footer__column site-footer__contacts" aria-labelledby="footer-contacts-title">
          <h2 id="footer-contacts-title">Contatti</h2>
          <address>
            <div>
              <FooterIcon name="address" />
              <p><strong>Indirizzo</strong>{contact.address.map((line) => <span key={line}>{line}</span>)}</p>
            </div>
            <div>
              <FooterIcon name="phone" />
              <p><strong>Telefono</strong>{phoneHref && contact.phone ? <a href={phoneHref} aria-label={`Chiama Officina Belviso al numero ${contact.phone}`}>{contact.phone}</a> : <span>In aggiornamento</span>}</p>
            </div>
            <div>
              <FooterIcon name="email" />
              <p><strong>Email</strong>{contact.email ? <a href={`mailto:${contact.email}`} aria-label={`Invia un'email a ${contact.email}`}>{contact.email}</a> : <span>In aggiornamento</span>}</p>
            </div>
            <div>
              <FooterIcon name="hours" />
              <div className="site-footer__hours">
                <strong>Orari</strong>
                <dl>
                  <div><dt>Lun–Ven</dt><dd>{weekdayHours}</dd></div>
                  <div><dt>Sabato</dt><dd>{saturdayHours}</dd></div>
                  <div><dt>Domenica</dt><dd>{sundayHours}</dd></div>
                </dl>
              </div>
            </div>
          </address>
        </section>

        <nav className="site-footer__column" aria-labelledby="footer-useful-title">
          <h2 id="footer-useful-title">Link utili</h2>
          <ul className="site-footer__links">
            <li><a href="/privacy-policy">Privacy Policy</a></li>
            <li><a href="/cookie-policy">Cookie Policy</a></li>
            <li><button type="button" onClick={openPreferences}>Gestisci cookie</button></li>
            <li><span aria-disabled="true">Termini di utilizzo</span></li>
            <li><span aria-disabled="true">Mappa del sito</span></li>
          </ul>
        </nav>
      </Container>

      <Container className="site-footer__bottom">
        <p>© {new Date().getFullYear()} {contact.companyName}<span>Tutti i diritti riservati.</span></p>
        <p>Progettato e sviluppato da <a href={credits.url} target="_blank" rel="noreferrer">{credits.label}</a></p>
      </Container>
    </footer>
  )
}
