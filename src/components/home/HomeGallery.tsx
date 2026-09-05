import { gallerySlots } from '../../data/homeContent'
import { placeholderImages } from '../../config/placeholderImages'
import { Container } from '../ui/Container'
import { Card } from '../ui/Card'
import { PremiumCarousel } from '../ui/PremiumCarousel'
import { HomeBrands } from './HomeBrands'
import { HomeSectionHeader } from './HomeSectionHeader'
import { PlaceholderImage } from './PlaceholderImage'

export function HomeGallery() {
  return (
    <section className="home-section home-gallery" id="galleria" aria-labelledby="gallery-title">
      <Container data-reveal-group>
        <HomeSectionHeader
          eyebrow="I nostri lavori"
          title="Il nostro lavoro parla per noi."
          titleId="gallery-title"
          description="Scopri le principali tipologie di intervento dedicate alla diagnosi, alla manutenzione e al ripristino dei veicoli industriali."
        />
        <PremiumCarousel
          ariaLabel="I nostri lavori"
          previousLabel="Lavoro precedente"
          nextLabel="Lavoro successivo"
        >
          {gallerySlots.map((item, index) => (
            <Card className="work-card carousel-card" key={item.title} data-reveal>
              <PlaceholderImage
                {...placeholderImages.works[index].image}
                ratio="landscape"
              />
              <div className="work-card__body">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </Card>
          ))}
        </PremiumCarousel>
        <HomeBrands />
      </Container>
    </section>
  )
}
