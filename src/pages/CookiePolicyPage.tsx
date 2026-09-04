import {
  consentCategoryDetails,
  cookiePolicyMetadata,
  cookieRegistry,
  externalResourceAudit,
  type ConsentCategory,
} from '../config/cookieConsent'
import { useCookieConsent } from '../hooks/useCookieConsent'
import { SiteLayout } from '../components/layout/SiteLayout'
import { Button } from '../components/ui/Button'
import { Container } from '../components/ui/Container'

const categoryOrder = [
  'necessary',
  'preferences',
  'analytics',
  'marketing',
  'externalMedia',
] as const satisfies readonly ConsentCategory[]

export function CookiePolicyPage() {
  const { openPreferences } = useCookieConsent()

  return (
    <SiteLayout>
      <article className="policy-page" aria-labelledby="cookie-policy-title">
        <Container className="policy-page__container">
          <header className="policy-page__header">
            <p className="eyebrow">Informativa</p>
            <h1 id="cookie-policy-title">Cookie Policy</h1>
            <p>
              Versione {cookiePolicyMetadata.version} · Ultimo aggiornamento:{' '}
              {cookiePolicyMetadata.updatedAt}
            </p>
          </header>

          <section>
            <h2>Cosa sono i cookie</h2>
            <p>
              I cookie sono piccoli file che un sito può memorizzare nel
              browser. Tecnologie analoghe possono essere utilizzate per
              fornire funzionalità o caricare contenuti di terze parti.
            </p>
          </section>

          <section>
            <h2>Scelte disponibili</h2>
            <p>
              Il sito utilizza un cookie tecnico per ricordare le preferenze.
              Le categorie opzionali restano disattivate finché non viene
              espresso un consenso. Puoi modificare o revocare la scelta in
              qualsiasi momento.
            </p>
            <Button type="button" variant="outline" onClick={openPreferences}>
              Gestisci cookie
            </Button>
          </section>

          <section>
            <h2>Categorie e strumenti rilevati</h2>
            <div className="policy-registry">
              {categoryOrder.map((category) => {
                const entries = cookieRegistry[category]

                return (
                  <section className="policy-registry__category" key={category}>
                    <h3>{consentCategoryDetails[category].label}</h3>
                    <p>{consentCategoryDetails[category].description}</p>
                    {entries.length > 0 ? (
                      <dl>
                        {entries.map((entry) => (
                          <div key={entry.id}>
                            <dt>{entry.name}</dt>
                            <dd><strong>Provider:</strong> {entry.provider}</dd>
                            <dd><strong>Finalità:</strong> {entry.purpose}</dd>
                            <dd><strong>Durata:</strong> {entry.duration}</dd>
                            <dd>
                              <strong>Parte:</strong>{' '}
                              {entry.firstParty ? 'Prima parte' : 'Terza parte'}
                            </dd>
                            {entry.policyUrl ? (
                              <dd>
                                <a href={entry.policyUrl} target="_blank" rel="noreferrer">
                                  Informativa del provider
                                </a>
                              </dd>
                            ) : null}
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="policy-registry__empty">
                        Nessun cookie o servizio rilevato in questa categoria.
                      </p>
                    )}
                  </section>
                )
              })}
            </div>
          </section>

          <section>
            <h2>Contenuti esterni</h2>
            <p>
              Google Maps viene caricato soltanto dopo l’autorizzazione alla
              categoria “Contenuti esterni”. Prima della scelta viene mostrato
              un placeholder locale.
            </p>
          </section>

          <section>
            <h2>Risorse esterne senza storage rilevato</h2>
            <p>
              L’audit del codice e del browser ha rilevato le seguenti risorse
              di terza parte. Non sono tracker installati dal sito e non è stato
              osservato storage applicativo associato, ma la richiesta di rete
              comunica al fornitore dati tecnici come l’indirizzo IP.
            </p>
            <div className="policy-registry">
              {externalResourceAudit.map((entry) => (
                <section className="policy-registry__category" key={entry.id}>
                  <h3>{entry.name}</h3>
                  <dl>
                    <div>
                      <dt>Provider</dt>
                      <dd>{entry.provider}</dd>
                      <dt>Finalità</dt>
                      <dd>{entry.purpose}</dd>
                      <dt>Categoria</dt>
                      <dd>Risorsa fotografica esterna</dd>
                      <dt>Durata</dt>
                      <dd>{entry.duration}</dd>
                      <dt>Parte</dt>
                      <dd>Terza parte</dd>
                      <dt>Caricamento prima del consenso</dt>
                      <dd>{entry.loadedBeforeConsent ? 'Sì' : 'No'}</dd>
                      <dt>Cookie/storage rilevato</dt>
                      <dd>{entry.storageDetected ? 'Sì' : 'No'}</dd>
                      <dt>Informativa</dt>
                      <dd>
                        <a href={entry.policyUrl} target="_blank" rel="noreferrer">
                          Informativa del provider
                        </a>
                      </dd>
                    </div>
                  </dl>
                </section>
              ))}
            </div>
          </section>

          <section>
            <h2>Revoca e verifica finale</h2>
            <p>
              Puoi riaprire il centro preferenze dal link “Gestisci cookie” nel
              footer. La disattivazione dei contenuti esterni impedisce nuovi
              caricamenti e rimuove la mappa già montata dalla pagina.
            </p>
            <p className="policy-page__todo">
              TODO privacy: verificare con il titolare o il consulente la
              versione definitiva dell’informativa, le basi giuridiche, i
              trasferimenti e le durate dichiarate dai provider terzi. Valutare
              inoltre la sostituzione degli URL Pexels con asset locali prima
              della pubblicazione definitiva.
            </p>
          </section>
        </Container>
      </article>
    </SiteLayout>
  )
}
