import { brandSlots } from '../../data/homeContent'
import { PlaceholderImage } from './PlaceholderImage'

export function HomeBrands() {
  return (
    <section
      className="home-gallery__brands"
      aria-labelledby="brands-title"
      data-reveal
    >
      <div className="home-gallery__brands-header">
        <p className="eyebrow">Interventi sui principali marchi del settore</p>
        <h3 id="brands-title">Marchi assistiti</h3>
      </div>
      <div className="brands-grid">
        {brandSlots.map((brand) => (
          <PlaceholderImage
            alt={brand.label}
            className={`brand-slot ${brand.className}`}
            key={brand.label}
            ratio="brand"
            src={brand.src}
          />
        ))}
      </div>
    </section>
  )
}
