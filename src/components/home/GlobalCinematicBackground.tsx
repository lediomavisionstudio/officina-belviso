import type { CSSProperties } from 'react'
import { globalCinematicBackgroundConfig } from '../../config/globalCinematicBackground'

type CinematicBackgroundStyle = CSSProperties & {
  '--cinematic-background-image': string
  '--cinematic-background-image-mobile': string
}

export function GlobalCinematicBackground() {
  const style: CinematicBackgroundStyle = {
    '--cinematic-background-image': `url("${globalCinematicBackgroundConfig.image.src}")`,
    '--cinematic-background-image-mobile': `url("${globalCinematicBackgroundConfig.image.mobileSrc}")`,
  }

  return (
    <div className="cinematic-background" style={style} aria-hidden="true">
      <div className="cinematic-background__image" />
      <div className="cinematic-background__overlay" />
    </div>
  )
}
