import { Container } from '../ui/Container'

type ContentSectionProps = {
  id: string
  title: string
}

export function ContentSection({ id, title }: ContentSectionProps) {
  const titleId = `${id}-title`

  return (
    <section className="content-section" id={id} aria-labelledby={titleId}>
      <Container>
        <h2 id={titleId}>{title}</h2>
      </Container>
    </section>
  )
}
