import type { ReactNode, RefObject } from 'react'
import { HomeHeader } from '../home/HomeHeader'
import { Footer } from './Footer'

type SiteLayoutProps = {
  children: ReactNode
  className?: string
  pageRef?: RefObject<HTMLDivElement | null>
}

export function SiteLayout({ children, className = '', pageRef }: SiteLayoutProps) {
  return (
    <div className={`home-v2 ${className}`.trim()} ref={pageRef}>
      <a className="skip-link" href="#main-content">
        Salta al contenuto principale
      </a>
      <HomeHeader />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
