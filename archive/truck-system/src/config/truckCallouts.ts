export type TruckCalloutViewport = 'desktop' | 'tablet' | 'mobile'

export type TruckCalloutComponentId =
  | 'brakes'
  | 'air-compressor'
  | 'mechanical-suspension'
  | 'pneumatic-suspension'
  | 'abs'
  | 'ebs'
  | 'ecas'

export type TruckCalloutPoint = Readonly<{
  x: number
  y: number
}>

export type TruckCalloutLayout = Readonly<{
  start: TruckCalloutPoint
  bend: TruckCalloutPoint
  end: TruckCalloutPoint
  labelPosition: TruckCalloutPoint
  labelAlign: 'start' | 'center' | 'end'
}>

export type TruckCalloutDefinition = Readonly<{
  label: string
  desktop: TruckCalloutLayout
  tablet: TruckCalloutLayout
  mobile: TruckCalloutLayout
}>

const layout = (
  start: TruckCalloutPoint,
  bend: TruckCalloutPoint,
  end: TruckCalloutPoint,
  labelPosition: TruckCalloutPoint,
  labelAlign: TruckCalloutLayout['labelAlign'],
): TruckCalloutLayout =>
  Object.freeze({ start, bend, end, labelPosition, labelAlign })

export const truckCallouts: Readonly<
  Record<TruckCalloutComponentId, TruckCalloutDefinition>
> = Object.freeze({
  brakes: {
    label: 'Sistema frenante',
    desktop: layout(
      { x: 77, y: 76 },
      { x: 82, y: 69 },
      { x: 88, y: 69 },
      { x: 89.5, y: 69 },
      'start',
    ),
    tablet: layout(
      { x: 77, y: 75 },
      { x: 81, y: 70 },
      { x: 88, y: 70 },
      { x: 89.5, y: 70 },
      'start',
    ),
    mobile: layout(
      { x: 76, y: 74 },
      { x: 73, y: 68 },
      { x: 70, y: 68 },
      { x: 70, y: 66 },
      'center',
    ),
  },
  'air-compressor': {
    label: 'Aria compressa',
    desktop: layout(
      { x: 35, y: 57 },
      { x: 29, y: 50 },
      { x: 18, y: 50 },
      { x: 16.5, y: 50 },
      'end',
    ),
    tablet: layout(
      { x: 36, y: 57 },
      { x: 31, y: 52 },
      { x: 24, y: 52 },
      { x: 22.5, y: 52 },
      'end',
    ),
    mobile: layout(
      { x: 37, y: 57 },
      { x: 39, y: 52 },
      { x: 41, y: 52 },
      { x: 40, y: 49 },
      'center',
    ),
  },
  'mechanical-suspension': {
    label: 'Sospensioni meccaniche',
    desktop: layout(
      { x: 58, y: 70 },
      { x: 64, y: 63 },
      { x: 74, y: 63 },
      { x: 75.5, y: 63 },
      'start',
    ),
    tablet: layout(
      { x: 58, y: 69 },
      { x: 62, y: 64 },
      { x: 69, y: 64 },
      { x: 70.5, y: 64 },
      'start',
    ),
    mobile: layout(
      { x: 57, y: 68 },
      { x: 55, y: 63 },
      { x: 53, y: 63 },
      { x: 54, y: 59.5 },
      'center',
    ),
  },
  'pneumatic-suspension': {
    label: 'Sospensioni pneumatiche',
    desktop: layout(
      { x: 86, y: 65 },
      { x: 89, y: 58 },
      { x: 95, y: 58 },
      { x: 96, y: 58 },
      'end',
    ),
    tablet: layout(
      { x: 85, y: 64 },
      { x: 88, y: 59 },
      { x: 93, y: 59 },
      { x: 94, y: 59 },
      'end',
    ),
    mobile: layout(
      { x: 84, y: 63 },
      { x: 81, y: 58 },
      { x: 78, y: 58 },
      { x: 78, y: 54.5 },
      'center',
    ),
  },
  abs: {
    label: 'ABS',
    desktop: layout(
      { x: 50, y: 65 },
      { x: 44, y: 57 },
      { x: 33, y: 57 },
      { x: 31.5, y: 57 },
      'end',
    ),
    tablet: layout(
      { x: 50, y: 64 },
      { x: 46, y: 59 },
      { x: 39, y: 59 },
      { x: 37.5, y: 59 },
      'end',
    ),
    mobile: layout(
      { x: 49, y: 64 },
      { x: 47, y: 59 },
      { x: 45, y: 59 },
      { x: 45, y: 55.5 },
      'center',
    ),
  },
  ebs: {
    label: 'EBS',
    desktop: layout(
      { x: 67, y: 59 },
      { x: 73, y: 51 },
      { x: 83, y: 51 },
      { x: 84.5, y: 51 },
      'start',
    ),
    tablet: layout(
      { x: 67, y: 58 },
      { x: 71, y: 53 },
      { x: 78, y: 53 },
      { x: 79.5, y: 53 },
      'start',
    ),
    mobile: layout(
      { x: 66, y: 58 },
      { x: 64, y: 53 },
      { x: 62, y: 53 },
      { x: 62, y: 49.5 },
      'center',
    ),
  },
  ecas: {
    label: 'ECAS',
    desktop: layout(
      { x: 79, y: 57 },
      { x: 84, y: 49 },
      { x: 92, y: 49 },
      { x: 93.5, y: 49 },
      'start',
    ),
    tablet: layout(
      { x: 78, y: 56 },
      { x: 82, y: 51 },
      { x: 89, y: 51 },
      { x: 90.5, y: 51 },
      'start',
    ),
    mobile: layout(
      { x: 77, y: 56 },
      { x: 75, y: 51 },
      { x: 73, y: 51 },
      { x: 72.5, y: 47.5 },
      'center',
    ),
  },
})

export function getTruckCallout(componentId: string | null) {
  if (!componentId || !(componentId in truckCallouts)) return null
  return truckCallouts[componentId as TruckCalloutComponentId]
}
