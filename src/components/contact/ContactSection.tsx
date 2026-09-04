import { Container } from '../ui/Container'
import { placeholderImages } from '../../config/placeholderImages'
import { PlaceholderImage } from '../home/PlaceholderImage'
import { ContactForm, type ContactFormMode } from './ContactForm'
import { WorkshopBusinessCard } from './WorkshopBusinessCard'

type ContactSectionProps = {
  id: string
  mode: ContactFormMode
}

const sectionContent: Record<
  ContactFormMode,
  {
    description: string[]
    eyebrow: string
    notes: string[]
    notesTitle: string
    title: string
  }
> = {
  quote: {
    eyebrow: 'Contatti',
    title: 'Richiedi un preventivo',
    description: [
      'Descrivi il veicolo e l’intervento di cui hai bisogno.',
      'Valuteremo le informazioni fornite per ricontattarti con un riscontro chiaro nel più breve tempo possibile.',
    ],
    notesTitle: 'Informazioni utili',
    notes: [
      'Inserisci i dati utili a identificare il veicolo.',
      'Indica il tipo di intervento richiesto.',
      'Descrivi sintomi e anomalie nel modo più preciso possibile.',
    ],
  },
  career: {
    eyebrow: 'Opportunità',
    title: 'Lavora con noi',
    description: [
      'Cerchiamo persone motivate, precise e orientate alla qualità del lavoro.',
      'Invia una candidatura spontanea: valuteremo il tuo profilo in relazione alle opportunità disponibili.',
    ],
    notesTitle: 'La tua candidatura',
    notes: [
      'Inserisci recapiti aggiornati.',
      'Indica la posizione di tuo interesse.',
      'Presenta brevemente competenze ed esperienza.',
    ],
  },
}

export function ContactSection({ id, mode }: ContactSectionProps) {
  const content = sectionContent[mode]
  const titleId = `${id}-title`

  return (
    <section
      className={`contact-section contact-section--${mode}`}
      id={id}
      aria-labelledby={titleId}
      data-reveal-group
    >
      <Container className="contact-section__layout">
        {mode === 'quote' ? (
          <div className="contact-section__intro" data-reveal>
            <WorkshopBusinessCard titleId={titleId} />
          </div>
        ) : (
          <div className="contact-section__intro" data-reveal>
            <p className="eyebrow">{content.eyebrow}</p>
            <h2 id={titleId}>{content.title}</h2>
            <div className="contact-section__description">
              {content.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="contact-section__notes">
              <h3>{content.notesTitle}</h3>
              <ul>
                {content.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
            <PlaceholderImage
              {...placeholderImages.career.image}
              className="contact-section__career-image"
              ratio="landscape"
            />
          </div>
        )}
        <div data-reveal>
          <ContactForm mode={mode} />
        </div>
      </Container>
    </section>
  )
}
