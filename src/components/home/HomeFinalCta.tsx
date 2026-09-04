import { ContactSection } from '../contact/ContactSection'

export function HomeQuoteSection() {
  return <ContactSection id="richiedi-preventivo" mode="quote" />
}

export function HomeCareerSection() {
  return <ContactSection id="lavora-con-noi" mode="career" />
}

export function HomeFinalCta() {
  return (
    <>
      <HomeQuoteSection />
      <HomeCareerSection />
    </>
  )
}
