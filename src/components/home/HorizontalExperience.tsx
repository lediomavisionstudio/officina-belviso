import type { ReactNode } from 'react'

type HorizontalPanel = {
  id: string
  content: ReactNode
}

type HorizontalExperienceProps = {
  panels: HorizontalPanel[]
}

export function HorizontalExperience({ panels }: HorizontalExperienceProps) {
  return (
    <div className="horizontal-experience" data-horizontal-experience>
      <div className="horizontal-experience__viewport" data-horizontal-viewport>
        <div className="horizontal-experience__track" data-horizontal-track>
          {panels.map((panel) => (
            <div
              className="horizontal-experience__panel"
              data-horizontal-panel={panel.id}
              key={panel.id}
            >
              {panel.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
