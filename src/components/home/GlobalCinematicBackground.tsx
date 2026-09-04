import type { CSSProperties } from 'react'
import { globalCinematicBackgroundConfig } from '../../config/globalCinematicBackground'

type CinematicBackgroundStyle = CSSProperties & {
  '--cinematic-background-image': string
}

export function GlobalCinematicBackground() {
  const style: CinematicBackgroundStyle = {
    '--cinematic-background-image': `url("${globalCinematicBackgroundConfig.image.src}")`,
  }

  return (
    <div className="cinematic-background" style={style} aria-hidden="true">
      <div className="cinematic-background__image" />
      <div className="cinematic-background__overlay" />
    </div>
  )
}
