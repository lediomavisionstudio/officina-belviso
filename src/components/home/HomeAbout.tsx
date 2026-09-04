import { aboutKpis } from '../../config/aboutKpis'
import { ENABLE_GLOBAL_CINEMATIC_BACKGROUND } from '../../config/globalCinematicBackground'
import { placeholderImages } from '../../config/placeholderImages'
import { Container } from '../ui/Container'
import { HomeSectionHeader } from './HomeSectionHeader'
import { PlaceholderImage } from './PlaceholderImage'

function formatKpiValue(value: number, decimals = 0, suffix = '') {
  return `${value.toFixed(decimals)}${suffix}`
}

function AboutCopy() {
  return (
    <div className="home-about__content">
      <HomeSectionHeader
        eyebrow="OLTRE 60 ANNI DI ESPERIENZA"
        title="Dal 1962, evolviamo insieme ai veicoli."
        titleId="about-title"
      />
      <p className="home-about__body" data-reveal>
        Officina Belviso nasce a Noicattaro dall’esperienza di Felice Belviso e
        cresce come una storia di famiglia, competenza e passione per la meccanica.
        <br /><br />
        Dalle tradizionali balestre ai moderni sistemi elettronici, ogni generazione
        ha saputo evolvere insieme alla tecnologia, mantenendo intatto ciò che ci
        distingue da sempre: esperienza, precisione e lavoro di squadra.
        <span className="home-about__history" aria-label="Dal 1962 a oggi">
          <span>1962</span>
          <span className="home-about__history-line" aria-hidden="true">→</span>
          <span>OGGI</span>
        </span>
      </p>
    </div>
  )
}

function AboutStats() {
  return (
    <ul
      className="home-about__stats"
      aria-label="Statistiche di Officina Belviso"
    >
      {aboutKpis.map((kpi) => (
        <li key={kpi.title} data-reveal>
          <strong
            className="home-about__stat-value"
            data-kpi-value={kpi.value}
            data-kpi-decimals={kpi.decimals ?? 0}
            data-kpi-suffix={kpi.suffix ?? ''}
          >
            {formatKpiValue(kpi.value, kpi.decimals, kpi.suffix)}
          </strong>
          <span className="home-about__stat-title">{kpi.title}</span>
          {kpi.description ? (
            <span className="home-about__stat-description">
              {kpi.description}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function AboutImage() {
  return (
    <PlaceholderImage
      {...placeholderImages.about.image}
      className="home-about__image"
      ratio="portrait"
    />
  )
}

export function HomeAbout() {
  return (
    <section
      className="home-section home-about"
      id="chi-siamo"
      aria-labelledby="about-title"
    >
      {ENABLE_GLOBAL_CINEMATIC_BACKGROUND ? (
        <Container className="home-about__shell" data-reveal-group>
          <div className="home-about__layout home-about__panel">
            <AboutCopy />
            <AboutImage />
          </div>
          <AboutStats />
        </Container>
      ) : (
        <Container className="home-about__layout" data-reveal-group>
          <div className="home-about__content">
            <HomeSectionHeader
              eyebrow="OLTRE 60 ANNI DI ESPERIENZA"
              title="Dal 1962, evolviamo insieme ai veicoli."
              titleId="about-title"
            />
            <p className="home-about__body" data-reveal>
              Officina Belviso nasce a Noicattaro dall’esperienza di Felice Belviso e
              cresce come una storia di famiglia, competenza e passione per la meccanica.
              <br /><br />
              Dalle tradizionali balestre ai moderni sistemi elettronici, ogni generazione
              ha saputo evolvere insieme alla tecnologia, mantenendo intatto ciò che ci
              distingue da sempre: esperienza, precisione e lavoro di squadra.
              <span className="home-about__history" aria-label="Dal 1962 a oggi">
                <span>1962</span>
                <span className="home-about__history-line" aria-hidden="true">→</span>
                <span>OGGI</span>
              </span>
            </p>
            <AboutStats />
          </div>
          <AboutImage />
        </Container>
      )}
    </section>
  )
}
