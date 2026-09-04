import { homeServices } from '../../data/homeContent'
import { placeholderImages } from '../../config/placeholderImages'
import { getHomeSectionHref } from '../../utils/path'
import { Container } from '../ui/Container'
import { Card } from '../ui/Card'
import { PremiumCarousel } from '../ui/PremiumCarousel'
import { HomeSectionHeader } from './HomeSectionHeader'
import { PlaceholderImage } from './PlaceholderImage'

export function HomeServices() {
  return (
    <section className="home-section home-services" id="servizi" aria-labelledby="services-title">
      <Container data-reveal-group>
        <HomeSectionHeader
          eyebrow="Competenze"
          title="Servizi per l’efficienza del tuo veicolo."
          titleId="services-title"
          description="Dalla diagnosi alla manutenzione, ogni attività è affrontata con metodo, precisione e attenzione alle reali esigenze del veicolo."
        />
        <PremiumCarousel
          ariaLabel="Servizi Officina Belviso"
          previousLabel="Servizio precedente"
          nextLabel="Servizio successivo"
        >
          {homeServices.map((service, index) => (
            <Card
              className="service-card carousel-card"
              key={service.id}
              data-service-id={service.id}
              data-reveal
            >
              <PlaceholderImage
                {...placeholderImages.services[index].image}
                ratio="service"
              />
              <div className="service-card__body">
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <a
                  className="card-link"
                  href={getHomeSectionHref('richiedi-preventivo')}
                  data-quote-service-id={service.id}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  Richiedi preventivo <span aria-hidden="true">↗</span>
                </a>
              </div>
            </Card>
          ))}
        </PremiumCarousel>
      </Container>
    </section>
  )
}
