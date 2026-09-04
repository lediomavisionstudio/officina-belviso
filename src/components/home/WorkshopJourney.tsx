import type { ReactNode } from 'react'
import {
  WORKSHOP_JOURNEY_DEBUG,
  type WorkshopJourneyPanelId,
} from '../../config/workshopJourney'

type WorkshopJourneyPanel = {
  id: WorkshopJourneyPanelId
  content: ReactNode
}

type WorkshopJourneyProps = {
  panels: WorkshopJourneyPanel[]
}

export function WorkshopJourney({ panels }: WorkshopJourneyProps) {
  return (
    <div className="workshop-journey" data-workshop-journey>
      <div className="workshop-journey__viewport" data-workshop-viewport>
        <div className="workshop-journey__track" data-workshop-track>
          {panels.map((panel) => (
            <div
              className="workshop-journey__panel"
              data-workshop-panel={panel.id}
              key={panel.id}
            >
              {panel.content}
            </div>
          ))}
        </div>

        <div className="workshop-journey__line" aria-hidden="true">
          <span data-workshop-line />
        </div>

        {WORKSHOP_JOURNEY_DEBUG ? (
          <output className="workshop-journey__debug" data-workshop-debug>
            panel: home · progress: 0.000 · track: 0px
          </output>
        ) : null}
      </div>
    </div>
  )
}
