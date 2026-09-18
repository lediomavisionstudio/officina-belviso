import { useEffect } from 'react'
import { siteConfig } from '../../config/site'
import type { SeoMetadata } from '../../types/seo'

type SeoMetaProps = {
  metadata: SeoMetadata
}

const LOCAL_BUSINESS_JSON_LD_ID = 'officina-belviso-local-business-jsonld'

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.append(element)
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element?.setAttribute(name, value)
  })
}

function removeMeta(selector: string) {
  document.head.querySelector(selector)?.remove()
}

function serializeStructuredData(data: Readonly<Record<string, unknown>>) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function updateStructuredData(data?: Readonly<Record<string, unknown>>) {
  const existing = document.getElementById(LOCAL_BUSINESS_JSON_LD_ID)

  if (!data) {
    existing?.remove()
    return
  }

  const script = existing instanceof HTMLScriptElement
    ? existing
    : document.createElement('script')
  script.id = LOCAL_BUSINESS_JSON_LD_ID
  script.type = 'application/ld+json'
  script.textContent = serializeStructuredData(data)
  if (!script.isConnected) document.head.append(script)
}

export function SeoMeta({ metadata }: SeoMetaProps) {
  useEffect(() => {
    document.title = metadata.title

    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: metadata.description,
    })
    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: metadata.openGraph?.title ?? metadata.title,
    })
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: metadata.openGraph?.description ?? metadata.description,
    })
    upsertMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: 'website',
    })
    upsertMeta('meta[property="og:locale"]', {
      property: 'og:locale',
      content: 'it_IT',
    })
    upsertMeta('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: siteConfig.name,
    })
    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: metadata.twitter?.card ?? 'summary',
    })
    upsertMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: metadata.twitter?.title ?? metadata.title,
    })
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: metadata.twitter?.description ?? metadata.description,
    })
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: metadata.robots ?? 'index, follow',
    })

    const canonicalUrl = siteConfig.siteUrl
      ? new URL(metadata.canonicalPath, siteConfig.siteUrl).toString()
      : null
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.append(canonical)
      }
      canonical.href = canonicalUrl
      upsertMeta('meta[property="og:url"]', {
        property: 'og:url',
        content: canonicalUrl,
      })
    } else {
      canonical?.remove()
      removeMeta('meta[property="og:url"]')
    }

    updateStructuredData(metadata.structuredData)

    return () => {
      document.getElementById(LOCAL_BUSINESS_JSON_LD_ID)?.remove()
    }
  }, [metadata])

  return null
}
