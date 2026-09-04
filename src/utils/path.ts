export function normalizePathname(pathname: string) {
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '') || '/'
}

export function getHomeSectionHref(sectionId: string) {
  const hash = `#${sectionId}`
  return normalizePathname(window.location.pathname) === '/' ? hash : `/${hash}`
}
