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
        eyebrow="Officina Belviso"
        title="Chi siamo"
        titleId="about-title"
        description="Competenza tecnica, ascolto e attenzione in ogni intervento."
      />
      <p className="home-about__body" data-reveal>
        Officina Belviso si occupa della manutenzione e della riparazione di
        veicoli industriali con un approccio fondato su analisi accurate,
        comunicazione chiara e cura del lavoro. L’impiego di attrezzature moderne
        supporta diagnosi precise e interventi affidabili, pensati per riportare
        ogni veicolo nelle migliori condizioni operative.
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
              eyebrow="Officina Belviso"
              title="Chi siamo"
              titleId="about-title"
              description="Competenza tecnica, ascolto e attenzione in ogni intervento."
            />
            <p className="home-about__body" data-reveal>
              Officina Belviso si occupa della manutenzione e della riparazione di
              veicoli industriali con un approccio fondato su analisi accurate,
              comunicazione chiara e cura del lavoro. L’impiego di attrezzature moderne
              supporta diagnosi precise e interventi affidabili, pensati per riportare
              ogni veicolo nelle migliori condizioni operative.
            </p>
            <AboutStats />
          </div>
          <AboutImage />
        </Container>
      )}
    </section>
  )
}
