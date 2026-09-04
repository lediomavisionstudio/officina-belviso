import { SiteLayout } from '../components/layout/SiteLayout'
import { Container } from '../components/ui/Container'

export function PrivacyPolicyPage() {
  return (
    <SiteLayout>
      <article className="policy-page" aria-labelledby="privacy-policy-title">
        <Container className="policy-page__container">
          <header className="policy-page__header">
            <p className="eyebrow">Informativa</p>
            <h1 id="privacy-policy-title">Privacy Policy</h1>
          </header>
          <section className="policy-page__notice">
            <h2>Informativa in preparazione</h2>
            <p>
              Da completare con l’informativa definitiva del titolare.
            </p>
            <p>
              TODO privacy: integrare finalità, basi giuridiche, destinatari,
              tempi di conservazione, diritti degli interessati e contatti del
              titolare dopo verifica professionale.
            </p>
          </section>
        </Container>
      </article>
    </SiteLayout>
  )
}
