import { useRef } from 'react'
import { HomeAbout } from '../components/home/HomeAbout'
import { HomeFinalCta } from '../components/home/HomeFinalCta'
import { HomeGallery } from '../components/home/HomeGallery'
import { HomeHero } from '../components/home/HomeHero'
import { HomeServices } from '../components/home/HomeServices'
import { GlobalCinematicBackground } from '../components/home/GlobalCinematicBackground'
import { WorkshopJourney } from '../components/home/WorkshopJourney'
import { SiteLayout } from '../components/layout/SiteLayout'
import { ENABLE_GLOBAL_CINEMATIC_BACKGROUND } from '../config/globalCinematicBackground'
import { ENABLE_WORKSHOP_JOURNEY } from '../config/workshopJourney'
import { useHomeMotion } from '../motion/useHomeMotion'
import { useWorkshopJourney } from '../motion/useWorkshopJourney'

export function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null)
  useHomeMotion(pageRef)
  useWorkshopJourney(pageRef)

  const layoutClassName = [
    ENABLE_GLOBAL_CINEMATIC_BACKGROUND
      ? 'home-v2--global-cinematic'
      : undefined,
    ENABLE_WORKSHOP_JOURNEY
      ? 'home-v2--workshop-journey'
      : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <SiteLayout
      pageRef={pageRef}
      className={layoutClassName || undefined}
    >
      {ENABLE_GLOBAL_CINEMATIC_BACKGROUND ? (
        <GlobalCinematicBackground />
      ) : null}
      {ENABLE_WORKSHOP_JOURNEY ? (
        <>
          <WorkshopJourney
            panels={[
              { id: 'home', content: <HomeHero /> },
              { id: 'chi-siamo', content: <HomeAbout /> },
              { id: 'servizi', content: <HomeServices /> },
            ]}
          />
          <HomeGallery />
          <HomeFinalCta />
        </>
      ) : (
        <>
          <HomeHero />
          <HomeAbout />
          <HomeServices />
          <HomeGallery />
          <HomeFinalCta />
        </>
      )}
    </SiteLayout>
  )
}
