type SocialName = 'facebook' | 'instagram' | 'linkedin' | 'whatsapp'

type FooterSocialLinksProps = {
  links: Record<SocialName, string | null>
}

const socialItems: { label: string; name: SocialName }[] = [
  { name: 'facebook', label: 'Facebook' },
  { name: 'instagram', label: 'Instagram' },
  { name: 'linkedin', label: 'LinkedIn' },
  { name: 'whatsapp', label: 'WhatsApp' },
]

function SocialIcon({ name }: { name: SocialName }) {
  if (name === 'facebook') {
    return <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1Z" />
  }

  if (name === 'instagram') {
    return <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>
  }

  if (name === 'linkedin') {
    return <><rect x="4" y="9" width="4" height="11" /><path d="M6 4.5v.1M11 20V9h4v1.8A4 4 0 0 1 22 14v6h-4v-5.5c0-1.6-.8-2.5-2-2.5s-2 1-2 2.5V20h-3Z" /></>
  }

  return <><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" /><path d="M9 8.5c.5 3 2 4.5 5.5 6l1.5-1.5-2-1-1 1c-1.4-.7-2.3-1.6-3-3l1-1-1-2-1.5 1.5H9Z" /></>
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
              <a href={href} target="_blank" rel="noreferrer" aria-label={label}>
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
