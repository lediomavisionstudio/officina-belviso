export type TruckLightingComponentId =
  | 'brakes'
  | 'air-compressor'
  | 'mechanical-suspension'
  | 'pneumatic-suspension'
  | 'abs'
  | 'ebs'
  | 'ecas'

export type TruckLightingPreset = Readonly<{
  primaryColor: string
  secondaryColor: string
  glowPosition: Readonly<{ x: number; y: number }>
  glowSize: number
  glowOpacity: number
  vignetteStrength: number
  backgroundDepth: number
  transitionDuration: number
}>

export const TRUCK_LIGHTING_NEUTRAL: TruckLightingPreset = Object.freeze({
  primaryColor: 'rgb(112 124 138)',
  secondaryColor: 'rgb(181 188 196)',
  glowPosition: { x: 50, y: 57 },
  glowSize: 48,
  glowOpacity: 0.055,
  vignetteStrength: 0.28,
  backgroundDepth: 0.18,
  transitionDuration: 0.7,
})

export const truckLighting: Readonly<
  Record<TruckLightingComponentId, TruckLightingPreset>
> = Object.freeze({
  brakes: {
    primaryColor: 'rgb(111 34 36)',
    secondaryColor: 'rgb(144 70 70)',
    glowPosition: { x: 76, y: 70 },
    glowSize: 38,
    glowOpacity: 0.105,
    vignetteStrength: 0.33,
    backgroundDepth: 0.23,
    transitionDuration: 0.76,
  },
  'air-compressor': {
    primaryColor: 'rgb(54 102 108)',
    secondaryColor: 'rgb(104 141 145)',
    glowPosition: { x: 36, y: 55 },
    glowSize: 42,
    glowOpacity: 0.08,
    vignetteStrength: 0.3,
    backgroundDepth: 0.21,
    transitionDuration: 0.74,
  },
  'mechanical-suspension': {
    primaryColor: 'rgb(112 82 48)',
    secondaryColor: 'rgb(151 125 88)',
    glowPosition: { x: 57, y: 67 },
    glowSize: 39,
    glowOpacity: 0.075,
    vignetteStrength: 0.32,
    backgroundDepth: 0.22,
    transitionDuration: 0.76,
  },
  'pneumatic-suspension': {
    primaryColor: 'rgb(66 81 96)',
    secondaryColor: 'rgb(112 128 143)',
    glowPosition: { x: 82, y: 62 },
    glowSize: 40,
    glowOpacity: 0.085,
    vignetteStrength: 0.32,
    backgroundDepth: 0.22,
    transitionDuration: 0.78,
  },
  abs: {
    primaryColor: 'rgb(47 72 111)',
    secondaryColor: 'rgb(86 112 151)',
    glowPosition: { x: 50, y: 62 },
    glowSize: 38,
    glowOpacity: 0.085,
    vignetteStrength: 0.32,
    backgroundDepth: 0.22,
    transitionDuration: 0.74,
  },
  ebs: {
    primaryColor: 'rgb(53 91 112)',
    secondaryColor: 'rgb(92 130 151)',
    glowPosition: { x: 66, y: 57 },
    glowSize: 38,
    glowOpacity: 0.08,
    vignetteStrength: 0.31,
    backgroundDepth: 0.21,
    transitionDuration: 0.74,
  },
  ecas: {
    primaryColor: 'rgb(67 60 102)',
    secondaryColor: 'rgb(107 99 139)',
    glowPosition: { x: 77, y: 55 },
    glowSize: 39,
    glowOpacity: 0.085,
    vignetteStrength: 0.33,
    backgroundDepth: 0.22,
    transitionDuration: 0.76,
  },
})

export function getTruckLighting(componentId: string | null) {
  if (!componentId || !(componentId in truckLighting)) {
    return TRUCK_LIGHTING_NEUTRAL
  }

  return truckLighting[componentId as TruckLightingComponentId]
}
