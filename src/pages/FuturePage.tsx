import { SiteLayout } from '../components/layout/SiteLayout'
import { Container } from '../components/ui/Container'
import type { AppRoute } from '../types/routes'

type FuturePageProps = {
  route: AppRoute
}

export function FuturePage({ route }: FuturePageProps) {
  return (
    <SiteLayout>
      <section className="future-page" aria-labelledby="future-page-title">
        <Container>
          <h1 id="future-page-title">{route.pageTitle}</h1>
        </Container>
      </section>
    </SiteLayout>
  )
}
