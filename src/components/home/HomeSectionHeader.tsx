type HomeSectionHeaderProps = {
  eyebrow: string
  title: string
  titleId?: string
  description?: string
  align?: 'start' | 'center'
}

export function HomeSectionHeader({
  eyebrow,
  title,
  titleId,
  description,
  align = 'start',
}: HomeSectionHeaderProps) {
  return (
    <header className={`section-heading section-heading--${align}`} data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={titleId}>{title}</h2>
      {description ? <p className="section-heading__description">{description}</p> : null}
    </header>
  )
}
