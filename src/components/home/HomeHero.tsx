import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { placeholderImages } from '../../config/placeholderImages'
import { PlaceholderImage } from './PlaceholderImage'

export function HomeHero() {
  return (
    <section className="home-hero" id="home" aria-labelledby="home-hero-title">
      <Container className="home-hero__layout" data-hero-reveal-group>
        <div className="home-hero__copy">
          <p className="eyebrow" data-hero-reveal>Assistenza per veicoli industriali</p>
          <h1
            id="home-hero-title"
            aria-label="Competenza tecnica per i veicoli industriali."
            data-hero-reveal
          >
            <span className="home-hero__title-line" aria-hidden="true">
              <span data-hero-title-text>Competenza tecnica</span>
            </span>
            <span className="home-hero__title-line" aria-hidden="true">
              <span data-hero-title-text>per i veicoli industriali.</span>
            </span>
          </h1>
          <p className="home-hero__description" data-hero-reveal>
            Diagnosi, manutenzione e riparazione dei principali sistemi del veicolo,
            con interventi orientati a sicurezza, affidabilità e continuità operativa.
          </p>
          <div className="home-hero__actions" data-hero-reveal>
            <ButtonLink href="#servizi">Scopri i servizi</ButtonLink>
            <ButtonLink href="#richiedi-preventivo" variant="secondary">
              Richiedi un preventivo
            </ButtonLink>
          </div>
        </div>
      </Container>
      <div className="home-hero__visual" data-hero-reveal>
        <PlaceholderImage
          caption="Assistenza e manutenzione per veicoli industriali"
          {...placeholderImages.hero.image}
          className="home-hero__placeholder"
          priority
          ratio="hero"
        />
      </div>
      <div className="home-hero__overlay" aria-hidden="true" />
    </section>
  )
}
