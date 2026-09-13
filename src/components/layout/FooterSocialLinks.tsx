type SocialName = 'facebook' | 'instagram'

type FooterSocialLinksProps = {
  links: Record<SocialName, string | null>
}

const socialItems: { label: string; name: SocialName }[] = [
  { name: 'facebook', label: 'Facebook' },
  { name: 'instagram', label: 'Instagram' },
]

function SocialIcon({ name }: { name: SocialName }) {
  if (name === 'facebook') {
    return <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1Z" />
  }

  return <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>
}

export function FooterSocialLinks({ links }: FooterSocialLinksProps) {
  return (
    <ul className="site-footer__social" aria-label="Canali social">
      {socialItems.map(({ label, name }) => {
        const icon = (
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <SocialIcon name={name} />
          </svg>
        )
        const href = links[name]

        return (
          <li key={name}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                {icon}
              </a>
            ) : (
              <span className="site-footer__social-placeholder" aria-label={`${label}, collegamento in aggiornamento`} role="img">
                {icon}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
