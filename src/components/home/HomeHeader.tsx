import { StoryNav } from '../layout/StoryNav'
import { siteConfig } from '../../config/site'
import { getHomeSectionHref } from '../../utils/path'

export function HomeHeader() {
  return (
    <>
      <a
        className="brand-logo-frame"
        href={getHomeSectionHref('home')}
        aria-label={`${siteConfig.name} — torna alla Home`}
      >
        <img
          className="brand-logo-image"
          src="/assets/logo-officina-belviso-ufficiale.png"
          alt={siteConfig.name}
          width="1536"
          height="1024"
          decoding="async"
          draggable="false"
          fetchPriority="high"
        />
      </a>
      <StoryNav />
    </>
  )
}
