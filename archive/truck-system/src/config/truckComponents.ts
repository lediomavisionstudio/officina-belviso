import type { TruckExplorerComponent } from '../types/truckExplorer'

export const TRUCK_EXPLORER_DEBUG = false

export const TRUCK_EXPLORER_FRAME = Object.freeze({
  width: 1280,
  height: 720,
})

export const truckComponents: readonly TruckExplorerComponent[] = Object.freeze([
  {
    id: 'brakes',
    label: 'Sistema frenante',
    shortLabel: 'Freni',
    title: 'Sistema frenante',
    subtitle: 'Controllo, manutenzione e ripristino',
    description:
      'Interventi sui sistemi frenanti dei veicoli industriali, con verifica delle componenti pneumatiche ed elettroniche collegate.',
    serviceDetails: [
      'Verifica componenti e stato di usura',
      'Manutenzione e ripristino dell’impianto',
      'Diagnosi delle anomalie di frenata',
    ],
    desktopPosition: { xPercent: 77, yPercent: 76 },
    tabletPosition: { xPercent: 77, yPercent: 75 },
    mobilePosition: { xPercent: 76, yPercent: 74 },
    panelSide: 'left',
    order: 1,
    accent: 'red',
    ariaLabel: 'Esplora il sistema frenante',
  },
  {
    id: 'air-compressor',
    label: 'Aria compressa',
    shortLabel: 'Aria',
    title: 'Impianto aria compressa',
    subtitle: 'Pressione stabile per i sistemi pneumatici',
    description:
      'Controllo del circuito aria e dei componenti che alimentano frenatura, sospensioni e servizi pneumatici del veicolo.',
    serviceDetails: [
      'Verifica del compressore e delle perdite',
      'Controllo delle linee pneumatiche',
      'Ripristino della corretta pressione di esercizio',
    ],
    desktopPosition: { xPercent: 35, yPercent: 57 },
    tabletPosition: { xPercent: 36, yPercent: 57 },
    mobilePosition: { xPercent: 37, yPercent: 57 },
    panelSide: 'right',
    order: 2,
    accent: 'red',
    ariaLabel: 'Esplora l’impianto aria compressa',
  },
  {
    id: 'mechanical-suspension',
    label: 'Sospensioni meccaniche',
    shortLabel: 'Sosp. meccaniche',
    title: 'Sospensioni meccaniche',
    subtitle: 'Assetto, collegamenti e componenti di sostegno',
    description:
      'Verifica degli organi meccanici della sospensione per individuare giochi, usura e anomalie che compromettono stabilità e carico.',
    serviceDetails: [
      'Controllo degli elementi di collegamento',
      'Verifica di supporti e articolazioni',
      'Ripristino dei componenti usurati',
    ],
    desktopPosition: { xPercent: 58, yPercent: 70 },
    tabletPosition: { xPercent: 58, yPercent: 69 },
    mobilePosition: { xPercent: 57, yPercent: 68 },
    panelSide: 'left',
    order: 3,
    accent: 'red',
    ariaLabel: 'Esplora le sospensioni meccaniche',
  },
  {
    id: 'pneumatic-suspension',
    label: 'Sospensioni pneumatiche',
    shortLabel: 'Sosp. pneumatiche',
    title: 'Sospensioni pneumatiche',
    subtitle: 'Controllo dell’assetto e del circuito aria',
    description:
      'Diagnosi e manutenzione dei sistemi pneumatici che regolano altezza, stabilità e distribuzione del carico.',
    serviceDetails: [
      'Verifica dei soffietti e delle valvole',
      'Ricerca di perdite nel circuito',
      'Controllo della regolazione dell’assetto',
    ],
    desktopPosition: { xPercent: 86, yPercent: 65 },
    tabletPosition: { xPercent: 85, yPercent: 64 },
    mobilePosition: { xPercent: 84, yPercent: 63 },
    panelSide: 'left',
    order: 4,
    accent: 'red',
    ariaLabel: 'Esplora le sospensioni pneumatiche',
  },
  {
    id: 'abs',
    label: 'Diagnosi ABS',
    shortLabel: 'ABS',
    title: 'Diagnosi ABS',
    subtitle: 'Controllo del sistema antibloccaggio',
    description:
      'Diagnosi delle anomalie ABS e verifica dei segnali provenienti dai sensori e dai componenti collegati.',
    serviceDetails: [
      'Lettura degli errori di sistema',
      'Verifica sensori e cablaggi',
      'Controllo dei segnali ruota',
    ],
    desktopPosition: { xPercent: 50, yPercent: 65 },
    tabletPosition: { xPercent: 50, yPercent: 64 },
    mobilePosition: { xPercent: 49, yPercent: 64 },
    panelSide: 'right',
    order: 5,
    accent: 'red',
    ariaLabel: 'Esplora la diagnosi ABS',
  },
  {
    id: 'ebs',
    label: 'Diagnosi EBS',
    shortLabel: 'EBS',
    title: 'Diagnosi EBS',
    subtitle: 'Gestione elettronica della frenatura',
    description:
      'Controllo del sistema EBS e delle comunicazioni elettroniche che coordinano la risposta frenante del veicolo.',
    serviceDetails: [
      'Diagnosi delle centraline collegate',
      'Verifica dei collegamenti elettrici',
      'Controllo della comunicazione tra i moduli',
    ],
    desktopPosition: { xPercent: 67, yPercent: 59 },
    tabletPosition: { xPercent: 67, yPercent: 58 },
    mobilePosition: { xPercent: 66, yPercent: 58 },
    panelSide: 'left',
    order: 6,
    accent: 'red',
    ariaLabel: 'Esplora la diagnosi EBS',
  },
  {
    id: 'ecas',
    label: 'Diagnosi ECAS',
    shortLabel: 'ECAS',
    title: 'Diagnosi ECAS',
    subtitle: 'Controllo elettronico delle sospensioni',
    description:
      'Diagnosi del sistema ECAS per verificare sensori, attuatori e regolazione elettronica dell’altezza del veicolo.',
    serviceDetails: [
      'Lettura dei parametri del sistema',
      'Verifica sensori di livello e attuatori',
      'Controllo della regolazione elettronica',
    ],
    desktopPosition: { xPercent: 79, yPercent: 57 },
    tabletPosition: { xPercent: 78, yPercent: 56 },
    mobilePosition: { xPercent: 77, yPercent: 56 },
    panelSide: 'left',
    order: 7,
    accent: 'red',
    ariaLabel: 'Esplora la diagnosi ECAS',
  },
])

export function getTruckComponent(componentId: string | null) {
  if (!componentId) return null
  return truckComponents.find((component) => component.id === componentId) ?? null
}
