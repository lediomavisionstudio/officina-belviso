import { FloatingBrandNavigation } from '../layout/FloatingBrandNavigation'
import { Container } from '../ui/Container'
import { TruckSequenceStage } from './TruckSequenceStage'

export function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <FloatingBrandNavigation />
      <Container className="hero-scene">
        <div className="hero-copy">
          <h1 id="hero-title" data-hero-reveal>
            <span>Rimettiamo in strada</span>
            <strong>il tuo lavoro.</strong>
          </h1>
          <p data-hero-reveal>
            Specialisti nella riparazione e ricostruzione di veicoli industriali.
          </p>
          <div className="hero-actions" data-hero-reveal>
            <a className="button" href="#servizi">
              Scopri i servizi
            </a>
            <a className="button button--secondary" href="#galleria">
              I nostri lavori
            </a>
          </div>
        </div>

        <div className="hero-truck-stage">
          <div className="hero-truck-light" data-hero-truck-light aria-hidden="true" />
          <div className="hero-truck" data-hero-truck>
            <TruckSequenceStage />
          </div>
        </div>
      </Container>
    </section>
  )
}
